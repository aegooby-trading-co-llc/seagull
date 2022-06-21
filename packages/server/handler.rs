use self::core::{context, message, result};
use self::files::{content_type, etag};
use crate::{core, files, graphql};

/**
    General function for handling a `Message` object.
*/
pub async fn handle(
    message: &mut message::Message,
    _context: context::Context,
) -> result::Result<()> {
    let root_node = std::sync::Arc::new(juniper::RootNode::new(
        graphql::schema::Query,
        juniper::EmptyMutation::<()>::default(),
        juniper::EmptySubscription::<()>::default(),
    ));

    match (message.request.method(), message.request.uri().path()) {
        (&hyper::Method::GET, "/graphql") => {
            message.response = juniper_hyper::graphiql("/graphql", None).await;
        }
        (&hyper::Method::POST, "/graphql") => {
            message.response = juniper_hyper::graphql(
                root_node,
                std::sync::Arc::new(()),
                message.clone().await.request,
            )
            .await;
        }
        (&hyper::Method::POST, "/auth") => {
            // authentication (gay)
        }
        (&hyper::Method::GET, _) => {
            /* Removes leading "/" character from path (/image.png -> image.png) */
            let uri = message.request.uri().clone();
            let uri_path = uri.path();
            let pathname = match uri_path.strip_prefix('/') {
                Some(stripped) => stripped,
                None => uri_path,
            };
            #[cfg(feature = "dev")]
            {
                let path = std::path::Path::new(".").join("public/index.html");
                let mut response = hyper::Client::new()
                    .get(("http://localhost:3080/".to_string() + pathname).parse()?)
                    .await?;
                let is_file = match response.headers().get(hyper::header::CONTENT_TYPE) {
                    Some(content_type) => !content_type.to_str()?.starts_with("text/html"),
                    None => true,
                };
                if is_file {
                    *message.response.body_mut() =
                        hyper::Body::from(hyper::body::to_bytes(response.body_mut()).await?);
                } else {
                    /* Render React */
                    content_type::html(message)?;
                    let file = tokio::fs::File::open(path).await?;
                    let stream = tokio_util::io::ReaderStream::new(file);
                    *message.response.body_mut() = hyper::Body::wrap_stream(stream);
                }
            }
            #[cfg(feature = "prod")]
            {
                /* Points to main directory with all the JS/static files */
                let build_root = std::path::Path::new(".").join("build/esbuild");
                let path = match tokio::fs::metadata(build_root.join(pathname)).await {
                    Ok(metadata) => {
                        if metadata.is_file() {
                            build_root.join(pathname)
                        } else {
                            content_type::html(message)?;
                            build_root.join("public/index.html")
                        }
                    }
                    Err(_error) => {
                        content_type::html(message)?;
                        build_root.join("public/index.html")
                    }
                };

                /* Open file into stream and set it as the response body */
                let file = tokio::fs::File::open(path.clone()).await?;
                let stream = tokio_util::io::ReaderStream::new(file);
                *message.response.body_mut() = hyper::Body::wrap_stream(stream);

                /* Do ETag shit */
                if let Ok(metadata) = tokio::fs::metadata(path).await {
                    etag::generate(message, &metadata)?;
                }
            }
        }
        _ => {
            *message.response.status_mut() = hyper::StatusCode::METHOD_NOT_ALLOWED;
        }
    };

    /* Make sure some "content-type" is set */
    content_type::guess(message)?;
    return Ok(());
}
