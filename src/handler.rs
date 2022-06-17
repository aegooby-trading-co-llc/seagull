use crate::{context, message, result, schema};

/**
    General function for handling a `Message` object.
*/
pub async fn handle(
    message: &mut message::Message,
    context: context::Context,
) -> result::Result<()> {
    let root_node = std::sync::Arc::new(juniper::RootNode::new(
        schema::Query,
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
            /* Removes leading "/" character from path  */
            /* (/image.png -> image.png)                */
            let uri_path = message.request.uri().path();
            let pathname = match uri_path.strip_prefix('/') {
                Some(stripped) => stripped,
                None => uri_path,
            };
            /* Points to main directory with all the JS/static files    */
            let build_root = std::path::Path::new(".").join("build/esbuild");
            let path = match tokio::fs::metadata(build_root.join(pathname)).await {
                Ok(metadata) => {
                    if metadata.is_file() {
                        build_root.join(pathname)
                    } else {
                        build_root.join("public/index.html")
                    }
                }
                Err(_error) => build_root.join("public/index.html"),
            };
            let file = tokio::fs::File::open(path).await?;
            let stream = tokio_util::io::ReaderStream::new(file);
            *message.response.body_mut() = hyper::Body::wrap_stream(stream);
        }
        _ => {
            // what the fuck did you do
            // retard
            *message.response.status_mut() = hyper::StatusCode::NOT_FOUND;
        }
    };
    return Ok(());
}
