use hyper::header::HeaderValue;
use mime::Mime;

use crate::core::{error::Error, message::Message, result::Result};

/**
    Bruh.
*/
fn mime_to_header(mime_type: Mime) -> Result<HeaderValue> {
    Ok(HeaderValue::from_str(mime_type.to_string().as_str())?)
}
/**
    Sets the content type of a message response as "text/html".
*/
pub fn html(message: &mut Message) -> Result<()> {
    let content_type = mime_to_header(mime::TEXT_HTML_UTF_8)?;
    match message.response.headers().get(hyper::header::CONTENT_TYPE) {
        Some(_) => Err(Error::new(
            "html(): response already contains content type header",
        )),
        None => {
            message
                .response
                .headers_mut()
                .append(hyper::header::CONTENT_TYPE, content_type);
            Ok(())
        }
    }
}
/**
    Guesses the content type of a message based on its extension.
*/
pub fn guess(message: &mut Message) -> Result<()> {
    if message
        .response
        .headers()
        .contains_key(hyper::header::CONTENT_TYPE)
    {
        return Ok(());
    }
    let path = message.request.uri().path();
    let content_type = match mime_guess::from_path(path).first() {
        Some(guess) => mime_to_header(guess),
        None => mime_to_header(mime::APPLICATION_OCTET_STREAM),
    }?;
    message
        .response
        .headers_mut()
        .insert(hyper::header::CONTENT_TYPE, content_type);
    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn mime_to_header_ok() -> Result<()> {
        let header = mime_to_header(mime::APPLICATION_JAVASCRIPT_UTF_8)?;
        assert_eq!(header.to_str()?, "application/javascript; charset=utf-8");
        Ok(())
    }

    #[test]
    fn html_ok() -> Result<()> {
        let mut message = Message::default();
        html(&mut message)?;
        match message.response.headers().get(hyper::header::CONTENT_TYPE) {
            Some(value) => {
                assert_eq!(value.to_str()?, "text/html; charset=utf-8");
                Ok(())
            }
            None => Err(Error::new("")),
        }
    }
    #[test]
    fn html_err() -> Result<()> {
        let mut message = Message::default();
        message.response.headers_mut().append(
            hyper::header::CONTENT_TYPE,
            mime_to_header(mime::APPLICATION_JAVASCRIPT_UTF_8)?,
        );
        match html(&mut message) {
            Ok(_) => Err(Error::new("")),
            Err(_) => Ok(()),
        }
    }

    #[test]
    fn guess_ok() -> Result<()> {
        let mut message = Message::default();
        *message.request.uri_mut() = hyper::Uri::builder().path_and_query("/index.js").build()?;
        guess(&mut message)?;
        match message.response.headers().get(hyper::header::CONTENT_TYPE) {
            Some(value) => {
                assert_eq!(value.to_str()?, "application/javascript");
                Ok(())
            }
            None => Err(Error::new("")),
        }
    }
}
