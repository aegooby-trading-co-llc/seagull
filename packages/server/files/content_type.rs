use axum::{body::Body, http::Response};
use hyper::{header::HeaderValue, Uri};
use mime::Mime;

use crate::core::{err, Result};

/**
    Bruh.
*/
fn mime_to_header(mime_type: Mime) -> Result<HeaderValue> {
    Ok(HeaderValue::from_str(mime_type.to_string().as_str())?)
}
/**
    Sets the content type of a message response as "text/html".
*/
pub fn html(response: &mut Response<Body>) -> Result<()> {
    let content_type = mime_to_header(mime::TEXT_HTML_UTF_8)?;
    match response.headers().get(hyper::header::CONTENT_TYPE) {
        Some(_) => Err(err("html(): response already contains content type header")),
        None => {
            response
                .headers_mut()
                .append(hyper::header::CONTENT_TYPE, content_type);
            Ok(())
        }
    }
}
/**
    Guesses the content type of a message based on its extension.
*/
pub fn guess(uri: &Uri, response: &mut Response<Body>) -> Result<()> {
    if response.headers().contains_key(hyper::header::CONTENT_TYPE) {
        return Ok(());
    }
    let path = uri.path();
    let content_type = match mime_guess::from_path(path).first() {
        Some(guess) => mime_to_header(guess),
        None => mime_to_header(mime::APPLICATION_OCTET_STREAM),
    }?;
    response
        .headers_mut()
        .insert(hyper::header::CONTENT_TYPE, content_type);
    Ok(())
}

#[cfg(test)]
mod test {
    use axum::{
        body::Body,
        http::{Request, Response},
    };

    use crate::core::{err, Result};

    use super::{guess, html, mime_to_header};

    #[test]
    fn mime_to_header_ok() -> Result<()> {
        let header = mime_to_header(mime::APPLICATION_JAVASCRIPT_UTF_8)?;
        assert_eq!(header.to_str()?, "application/javascript; charset=utf-8");
        Ok(())
    }

    #[test]
    fn html_ok() -> Result<()> {
        let mut response = Response::new(Body::empty());
        html(&mut response)?;
        match response.headers().get(hyper::header::CONTENT_TYPE) {
            Some(value) => {
                assert_eq!(value.to_str()?, "text/html; charset=utf-8");
                Ok(())
            }
            None => Err(err("")),
        }
    }
    #[test]
    fn html_err() -> Result<()> {
        let mut response = Response::new(Body::empty());
        response.headers_mut().append(
            hyper::header::CONTENT_TYPE,
            mime_to_header(mime::APPLICATION_JAVASCRIPT_UTF_8)?,
        );
        match html(&mut response) {
            Ok(_) => Err(err("")),
            Err(_) => Ok(()),
        }
    }

    #[test]
    fn guess_ok() -> Result<()> {
        let mut request = Request::new(Body::empty());
        let mut response = Response::new(Body::empty());
        *request.uri_mut() = hyper::Uri::builder().path_and_query("/index.js").build()?;
        guess(request.uri(), &mut response)?;
        match response.headers().get(hyper::header::CONTENT_TYPE) {
            Some(value) => {
                assert_eq!(value.to_str()?, "application/javascript");
                Ok(())
            }
            None => Err(err("")),
        }
    }
}
