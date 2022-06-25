#![feature(test)]

#[cfg(all(not(feature = "dev"), not(feature = "prod")))]
compile_error!("Must enable one of \"dev\" or \"prod\" features");

mod core;
mod db;
mod files;
mod graphql;
mod handler;
#[cfg(feature = "prod")]
mod renderer;

use self::core::{context::Context, message::Message, result::Result};
use std::convert::Infallible;

use hyper::{Body, Request, Response};

#[macro_use]
extern crate diesel;

/**
    Listener CTRL-C interrupt to shut down "gracefully".
*/
async fn shutdown_signal() -> () {
    match tokio::signal::ctrl_c().await {
        Ok(()) => println!(),
        Err(error) => eprintln!("Failed to listen for interrupt: {}", error),
    }
}

/**
    Creates a `Message` and runs the `handler::handle()` function on it.
*/
async fn service_handler(
    context: Context,
    addr: std::net::SocketAddr,
    request: Request<Body>,
) -> std::result::Result<Response<Body>, Infallible> {
    let response = Response::new(Body::empty());
    let mut message = Message::new(request, response, addr);

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

async fn __main() -> Result<()> {
    dotenv::dotenv()?;

    /* 127.0.0.1:8787 = localhost:8787 */
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 8787));

    let context = Context::new()?;
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
    server.with_graceful_shutdown(shutdown_signal()).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    match __main().await {
        Ok(()) => (),
        Err(error) => eprintln!("{}", error),
    }
}
