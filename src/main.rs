mod schema;

#[derive(Clone)]
struct Context {
    // Whatever data your application needs can go here
}

async fn handle(
    _context: Context,
    _addr: std::net::SocketAddr,
    req: hyper::Request<hyper::Body>,
) -> Result<hyper::Response<hyper::Body>, std::convert::Infallible> {
    let mut response = hyper::Response::new("Penile, World".into());
    let root_node = std::sync::Arc::new(juniper::RootNode::new(
        schema::Query,
        juniper::EmptyMutation::<()>::default(),
        juniper::EmptySubscription::<()>::default(),
    ));
    match (req.method(), req.uri().path()) {
        (&hyper::Method::GET, "/graphql") => {
            response = juniper_hyper::graphiql("/graphql", None).await;
        }
        (&hyper::Method::POST, "/graphql") => {
            response = juniper_hyper::graphql(root_node, std::sync::Arc::new(()), req).await;
        }
        (&hyper::Method::POST, "/auth") => {
            // authentication (gay)
        }
        (&hyper::Method::GET, _) => {
            // pages and stuff
        }
        _ => {
            // what the fuck did you do
            // error
            // retard
            *response.status_mut() = hyper::StatusCode::NOT_FOUND;
        }
    };
    return Ok(response);
}

async fn shutdown_signal() {
    // Wait for the CTRL+C signal
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install CTRL+C signal handler");
}

#[tokio::main]
async fn main() {
    // We'll bind to 127.0.0.1:3000
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 3000));

    let context = Context {};
    let make_service =
        hyper::service::make_service_fn(move |conn: &hyper::server::conn::AddrStream| {
            // We have to clone the context to share it with each invocation of
            // `make_service`. If your data doesn't implement `Clone` consider using
            // an `std::sync::Arc`.
            let context = context.clone();

            // You can grab the address of the incoming connection like so.
            let addr = conn.remote_addr();

            // Create a `Service` for responding to the request.
            let service = hyper::service::service_fn(move |req| handle(context.clone(), addr, req));

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
