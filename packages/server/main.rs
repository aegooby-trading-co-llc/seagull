#![feature(test)]
#![forbid(unsafe_code)]

#[cfg(all(not(feature = "dev"), not(feature = "prod")))]
compile_error!("Must enable one of \"dev\" or \"prod\" features");

mod core;
mod db;
mod files;
mod graphql;
mod handler;

use self::core::{context::Context, Result};
use std::sync::Arc;

use axum::{body::Body, routing::get, Extension, Router, Server};
use tower::ServiceBuilder;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};

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

async fn seagull() -> Result<()> {
    dotenv::dotenv()?;

    /* http://127.0.0.1:8787 = http://localhost:8787 */
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 8787));

    let context = Context::new()?;
    let router = Router::<Body>::new()
        .route(
            "/graphql",
            get(handler::graphql_get).post(handler::graphql_post),
        )
        .fallback(get(handler::fallback_get))
        .layer(
            ServiceBuilder::new()
                .layer(CompressionLayer::new())
                .layer(TraceLayer::new_for_http())
                .layer(Extension(Arc::new(context))),
        );

    Server::bind(&addr)
        .serve(router.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

#[tokio::main(flavor = "multi_thread")]
async fn main() {
    match seagull().await {
        Ok(()) => (),
        Err(error) => eprintln!("{}", error),
    }
}
