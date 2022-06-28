use std::sync::Arc;

use axum::{
    body::Body,
    extract::OriginalUri,
    http::{Request, Response},
    response::{IntoResponse, Result as AxumResult},
    Extension,
};
use hyper::StatusCode;
use juniper_hyper::{graphiql, graphql};

use crate::{
    core::{context::Context, Result},
    files::content_type::guess,
    graphql::juniper_context::JuniperContext,
};

pub async fn fallback_get(original_uri: OriginalUri) -> AxumResult<Response<Body>> {
    match __fallback_get(original_uri).await {
        Ok(response) => Ok(response),
        Err(error) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("500 Internal Server Error: {}", error),
        )
            .into_response()
            .into()),
    }
}

async fn __fallback_get(OriginalUri(uri): OriginalUri) -> Result<Response<Body>> {
    /* Removes leading "/" character from path (/image.png -> image.png) */
    let uri_path = uri.path();
    let pathname = match uri_path.strip_prefix('/') {
        Some(stripped) => stripped,
        None => uri_path,
    };
    let mut response = Response::new(Body::empty());
    #[cfg(feature = "dev")]
    {
        use crate::files::content_type::html;
        use hyper::header::CONTENT_TYPE;
        use hyper::Client;
        use std::path::Path;
        use tokio::fs::File;
        use tokio_util::io::ReaderStream;

        let path = Path::new(".").join("public/index.html");
        *response.body_mut() = {
            let esbuild_response = Client::new()
                .get(("http://localhost:3080/".to_string() + pathname).parse()?)
                .await?;
            let is_file = match (
                esbuild_response.status(),
                esbuild_response.headers().get(CONTENT_TYPE),
            ) {
                (StatusCode::OK, Some(content_type)) => {
                    !content_type.to_str()?.starts_with("text/html")
                }
                _ => false,
            };
            if is_file {
                esbuild_response.into_body()
            } else {
                /* Render React */
                html(&mut response)?;
                let file = File::open(path).await?;
                let stream = ReaderStream::new(file);
                Body::wrap_stream(stream)
            }
        }
    }
    #[cfg(feature = "prod")]
    {
        use crate::{
            core::err,
            files::{content_type::html, etag::generate},
        };
        use hyper::Client;
        use std::path::Path;
        use tokio::fs::{metadata, File};
        use tokio_util::io::ReaderStream;

        /* Points to main directory with all the JS/static files */
        let build_root = Path::new(".").join("build");
        let react = match metadata(build_root.join(pathname)).await {
            Ok(metadata) => {
                if metadata.is_file() {
                    let path = build_root.join(pathname);
                    /* Open file into stream and set it as the response body */
                    let file = File::open(path.clone()).await?;
                    let stream = ReaderStream::new(file);
                    *response.body_mut() = Body::wrap_stream(stream);

                    /* Do ETag shit */
                    generate(&mut response, &metadata)?;

                    false
                } else {
                    true
                }
            }
            Err(_error) => true,
        };
        if react {
            let deno_response = Client::new()
                .get(("http://localhost:3737/".to_string() + pathname).parse()?)
                .await?;
            if deno_response.status() != StatusCode::OK {
                return Err(err("Failed to fetch React SSR"));
            }
            *response.body_mut() = deno_response.into_body();
            html(&mut response)?;
        }
    }
    guess(&uri, &mut response)?;
    Ok(response)
}

pub async fn graphql_get() -> AxumResult<Response<Body>> {
    match __graphql_get().await {
        Ok(response) => Ok(response),
        Err(error) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("500 Internal Server Error: {}", error),
        )
            .into_response()
            .into()),
    }
}

pub async fn __graphql_get() -> Result<Response<Body>> {
    let response = graphiql("/graphql", None).await;
    Ok(response)
}

pub async fn graphql_post(
    ext: Extension<Arc<Context>>,
    request: Request<Body>,
) -> AxumResult<Response<Body>> {
    match __graphql_post(ext, request).await {
        Ok(response) => Ok(response),
        Err(error) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("500 Internal Server Error: {}", error),
        )
            .into_response()
            .into()),
    }
}

pub async fn __graphql_post(
    Extension(context): Extension<Arc<Context>>,
    request: Request<Body>,
) -> Result<Response<Body>> {
    let juniper_context = Arc::new(JuniperContext::new(context.clone()));
    let response = graphql(context.graphql_root_node.clone(), juniper_context, request).await;
    Ok(response)
}
