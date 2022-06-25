use std::sync::{Arc, RwLock};

use hyper::{Method, StatusCode};
use juniper_hyper::{graphiql, graphql};

use crate::{
    core::{context::Context, message::Message, result::Result},
    files::content_type::guess,
    graphql::juniper_context::JuniperContext,
};

/**
    General function for handling a `Message` object.
*/
pub async fn handle(message: &mut Message, context: Context) -> Result<()> {
    match (message.request.method(), message.request.uri().path()) {
        (&Method::GET, "/graphql") => {
            message.response = graphiql("/graphql", None).await;
        }
        (&Method::POST, "/graphql") => {
            let juniper_context = Arc::new(JuniperContext::new(
                Arc::new(RwLock::new(message.clone().await)),
                context.clone(),
            ));
            message.response = graphql(
                context.graphql_root_node,
                juniper_context,
                message.clone().await.request,
            )
            .await;
        }
        (&Method::GET, _) => {
            /* Removes leading "/" character from path (/image.png -> image.png) */
            let uri = message.request.uri().clone();
            let uri_path = uri.path();
            let pathname = match uri_path.strip_prefix('/') {
                Some(stripped) => stripped,
                None => uri_path,
            };
            #[cfg(feature = "dev")]
            {
                use crate::files::content_type::html;
                use hyper::{body, header::CONTENT_TYPE, Body, Client};
                use std::path::Path;
                use tokio::fs::File;
                use tokio_util::io::ReaderStream;

                let path = Path::new(".").join("public/index.html");
                let mut response = Client::new()
                    .get(("http://localhost:3080/".to_string() + pathname).parse()?)
                    .await?;
                let is_file = match response.headers().get(CONTENT_TYPE) {
                    Some(content_type) => !content_type.to_str()?.starts_with("text/html"),
                    None => true,
                };
                if is_file {
                    *message.response.body_mut() =
                        Body::from(body::to_bytes(response.body_mut()).await?);
                } else {
                    /* Render React */
                    html(message)?;
                    let file = File::open(path).await?;
                    let stream = ReaderStream::new(file);
                    *message.response.body_mut() = Body::wrap_stream(stream);
                }
            }
            #[cfg(feature = "prod")]
            {
                use crate::{
                    files::{content_type::html, etag::generate},
                    renderer::ReactRenderer,
                };
                use hyper::Body;
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
                            *message.response.body_mut() = Body::wrap_stream(stream);

                            /* Do ETag shit */
                            generate(message, &metadata)?;

                            false
                        } else {
                            true
                        }
                    }
                    Err(_error) => true,
                };
                if react {
                    let entry = "packages/server/renderer/embedded/index.mjs";
                    let mut buffer = ReactRenderer::render(entry).await?;
                    buffer.terminate();
                    let stream = ReaderStream::new(buffer);
                    *message.response.body_mut() = Body::wrap_stream(stream);
                    html(message)?;
                }
            }
        }
        _ => {
            *message.response.status_mut() = StatusCode::METHOD_NOT_ALLOWED;
        }
    };

    /* Make sure some "content-type" is set */
    guess(message)?;
    return Ok(());
}

#[cfg(test)]
mod bench {
    extern crate test;

    use hyper::{Method, Uri};
    use std::process::Termination;
    use test::Bencher;
    use tokio::runtime::Runtime;

    use crate::core::{context::Context, message::Message};

    use super::handle;

    #[bench]
    fn graphql_post(bencher: &mut Bencher) -> impl Termination {
        if dotenv::dotenv().is_err() {
            return ();
        }
        let mut message = Message::default();
        *message.request.method_mut() = Method::POST;
        *message.request.uri_mut() = Uri::builder()
            .path_and_query("/graphql")
            .build()
            .unwrap_or(Uri::default());
        match (Runtime::new(), Context::new()) {
            (Ok(runtime), Ok(context)) => bencher
                .iter(|| runtime.block_on(async { handle(&mut message, context.clone()).await })),
            _ => (),
        }
    }

    #[bench]
    fn graphql_get(bencher: &mut Bencher) -> impl Termination {
        if dotenv::dotenv().is_err() {
            return ();
        }
        let mut message = Message::default();
        *message.request.method_mut() = Method::GET;
        *message.request.uri_mut() = Uri::builder()
            .path_and_query("/graphql")
            .build()
            .unwrap_or(Uri::default());
        match (Runtime::new(), Context::new()) {
            (Ok(runtime), Ok(context)) => bencher
                .iter(|| runtime.block_on(async { handle(&mut message, context.clone()).await })),
            _ => (),
        }
    }
}
