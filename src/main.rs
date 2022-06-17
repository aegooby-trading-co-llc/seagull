mod context;
mod error;
mod handler;
mod message;
mod result;
mod schema;

async fn shutdown_signal() -> () {
    // Wait for the CTRL+C signal
    match tokio::signal::ctrl_c().await {
        Ok(()) => (),
        Err(error) => eprintln!("Failed to listen for CTRL-C: {}", error),
    }
}

async fn service_handler(
    context: context::Context,
    addr: std::net::SocketAddr,
    request: hyper::Request<hyper::Body>,
) -> Result<hyper::Response<hyper::Body>, std::convert::Infallible> {
    let response = hyper::Response::new(hyper::Body::empty());
    let mut message = message::Message::new(request, response, addr);

    /* Registers a 500 Internal Server Error if we do something wrong and mess up   */
    /* the message handling somehow.                                                */
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
    // We'll bind to 127.0.0.1:3000
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 3000));

    let context = context::Context {};
    let make_service =
        hyper::service::make_service_fn(move |conn: &hyper::server::conn::AddrStream| {
            // We have to clone the context to share it with each invocation of
            // `make_service`. If your data doesn't implement `Clone` consider using
            // an `std::sync::Arc`.
            let context = context.clone();

            // You can grab the address of the incoming connection like so.
            let addr = conn.remote_addr();

            // Create a `Service` for responding to the request.
            let service = hyper::service::service_fn(move |request| {
                service_handler(context.clone(), addr, request)
            });

            // Return the service to hyper.
            async move { Ok::<_, std::convert::Infallible>(service) }
        });

    let server = hyper::Server::bind(&addr).serve(make_service);

    // And now add a graceful shutdown signal...
    let graceful = server.with_graceful_shutdown(shutdown_signal());

    // Run this server for... forever!
    if let Err(e) = graceful.await {
        eprintln!("server error: {}", e);
    }
}
