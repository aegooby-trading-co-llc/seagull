mod content_type;
mod context;
mod error;
mod etag;
mod handler;
mod message;
mod result;
mod schema;

async fn shutdown_signal() -> () {
    /* Wait for the CTRL+C signal */
    match tokio::signal::ctrl_c().await {
        Ok(()) => println!(),
        Err(error) => eprintln!("Failed to listen for interrupt: {}", error),
    }
}

async fn service_handler(
    context: context::Context,
    addr: std::net::SocketAddr,
    request: hyper::Request<hyper::Body>,
) -> Result<hyper::Response<hyper::Body>, std::convert::Infallible> {
    let response = hyper::Response::new(hyper::Body::empty());
    let mut message = message::Message::new(request, response, addr);

    /* Registers a 500 Internal Server Error if we do something */
    /* wrong and mess up the message handling somehow           */
    match handler::handle(&mut message, context).await {
        Ok(()) => (),
        Err(error) => {
            *message.response.status_mut() = hyper::StatusCode::INTERNAL_SERVER_ERROR;
            *message.response.body_mut() = hyper::Body::from(format!("{}", error));
        }
    };
    Ok(message.done())
}

#[tokio::main]
async fn main() {
    /* 127.0.0.1:8787 = localhost:8787 */
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 8787));

    let context = context::Context {};
    let make_service =
        hyper::service::make_service_fn(move |conn: &hyper::server::conn::AddrStream| {
            /* We have to clone the context to share it with each */
            /* invocation of `make_service`                       */
            let context = context.clone();
            let addr = conn.remote_addr();

            let service = hyper::service::service_fn(move |request| {
                service_handler(context.clone(), addr, request)
            });

            async move { Ok::<_, std::convert::Infallible>(service) }
        });

    let server = hyper::Server::bind(&addr).serve(make_service);

    /* Allows a controlled exit from the server.    */
    let graceful = server.with_graceful_shutdown(shutdown_signal());

    if let Err(error) = graceful.await {
        eprintln!("Fatal server error: {}", error);
    }
}
