use std::net::SocketAddr;

use hyper::{body, Body, Request, Response};

use crate::core::result::Result;

/**
    Object containing the incoming request and the current response for
    an individual HTTP connection. This is helpful for when a response
    needs to be edited in a GraphQL resolver or modified along the way.
    This should also be updated to include cookies.
*/
#[derive(Debug)]
pub struct Message {
    pub request: Request<Body>,
    pub response: Response<Body>,
    pub address: SocketAddr,
}

impl Message {
    /**
       Makes a copy of the message, requires await.
    */
    pub async fn clone(&mut self) -> Self {
        async fn clone_hyper(message: &mut Message) -> Result<(Request<Body>, Response<Body>)> {
            let request_body = body::to_bytes(message.request.body_mut()).await?;
            *message.request.body_mut() = Body::from(request_body.clone());
            let mut request = Request::builder()
                .version(message.request.version())
                .method(message.request.method())
                .uri(message.request.uri())
                .body(Body::from(request_body.clone()))?;
            for (key, value) in message.request.headers() {
                request.headers_mut().append(key, value.clone());
            }

            let response_body = body::to_bytes(message.response.body_mut()).await?;
            *message.response.body_mut() = Body::from(response_body.clone());
            let mut response = Response::builder()
                .version(message.response.version())
                .status(message.response.status())
                .body(Body::from(response_body))?;
            for (key, value) in message.response.headers() {
                response.headers_mut().append(key, value.clone());
            }

            Ok((request, response))
        }
        let (request, response) = match clone_hyper(self).await {
            Ok((request, response)) => (request, response),
            Err(_error) => (Request::default(), Response::default()),
        };
        Self {
            request,
            response,
            address: self.address,
        }
    }
    pub fn new(request: Request<Body>, response: Response<Body>, address: SocketAddr) -> Self {
        Self {
            request,
            response,
            address,
        }
    }
    pub fn done(self) -> Response<Body> {
        self.response
    }
}

impl Default for Message {
    fn default() -> Self {
        Self {
            request: Default::default(),
            response: Default::default(),
            address: SocketAddr::from(([127, 0, 0, 1], 8787)),
        }
    }
}
