use crate::result;

/**
    Object containing the incoming request and the current response for
    an individual HTTP connection. This is helpful for when a response
    needs to be edited in a GraphQL resolver or modified along the way.
    This should also be updated to include cookies.
*/
#[derive(Debug)]
pub struct Message {
    pub request: hyper::Request<hyper::Body>,
    pub response: hyper::Response<hyper::Body>,
    pub address: std::net::SocketAddr,
}

impl Message {
    /**
       Makes a copy of the message, requires await.
    */
    pub async fn clone(&mut self) -> Self {
        async fn clone_hyper(
            message: &mut Message,
        ) -> result::Result<(hyper::Request<hyper::Body>, hyper::Response<hyper::Body>)> {
            let request_body = hyper::body::to_bytes(message.request.body_mut()).await?;
            *message.request.body_mut() = hyper::Body::from(request_body.clone());
            let mut request = hyper::Request::builder()
                .version(message.request.version())
                .method(message.request.method())
                .uri(message.request.uri())
                .body(hyper::Body::from(request_body.clone()))?;
            for (key, value) in message.request.headers() {
                request.headers_mut().append(key, value.clone());
            }

            let response_body = hyper::body::to_bytes(message.response.body_mut()).await?;
            *message.response.body_mut() = hyper::Body::from(response_body.clone());
            let mut response = hyper::Response::builder()
                .version(message.response.version())
                .status(message.response.status())
                .body(hyper::Body::from(response_body))?;
            for (key, value) in message.response.headers() {
                response.headers_mut().append(key, value.clone());
            }

            Ok((request, response))
        }
        let (request, response) = match clone_hyper(self).await {
            Ok((request, response)) => (request, response),
            Err(_error) => (hyper::Request::default(), hyper::Response::default()),
        };
        Self {
            request,
            response,
            address: self.address,
        }
    }
    pub fn new(
        request: hyper::Request<hyper::Body>,
        response: hyper::Response<hyper::Body>,
        address: std::net::SocketAddr,
    ) -> Self {
        Self {
            request,
            response,
            address,
        }
    }
    pub fn done(self) -> hyper::Response<hyper::Body> {
        self.response
    }
}
