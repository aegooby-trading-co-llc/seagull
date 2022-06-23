use std::{
    path::Path,
    sync::{Arc, RwLock},
};

use hyper::{body, header::CONTENT_TYPE, Body, Client, Method, StatusCode};
use juniper_hyper::{graphiql, graphql};
use tokio::{
    fs::{metadata, File},
    task::spawn_blocking,
};
use tokio_util::io::ReaderStream;

use crate::{
    core::{context::Context, message::Message, result::Result},
    files::{
        content_type::{guess, html},
        etag::generate,
    },
    graphql::juniper_context::JuniperContext,
    renderer::render_react,
};

/**
    General function for handling a `Message` object.
*/
pub async fn handle(message: &mut Message, context: Context) -> Result<()> {
    let juniper_context = Arc::new(JuniperContext::new(
        Arc::new(RwLock::new(message.clone().await)),
        context.clone(),
    ));

    match (message.request.method(), message.request.uri().path()) {
        (&Method::GET, "/graphql") => {
            message.response = graphiql("/graphql", None).await;
        }
        (&Method::POST, "/graphql") => {
            message.response = graphql(
                context.graphql_root_node,
                juniper_context.clone(),
                message.clone().await.request,
            )
            .await;
        }
        (&Method::POST, "/auth") => {
            // authentication (gay)
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
                    let buffer = spawn_blocking(|| render_react()).await??;
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
