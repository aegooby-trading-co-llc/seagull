use crate::{message, result};

/**
    Bruh.
*/
fn mime_to_header(mime_type: mime::Mime) -> result::Result<hyper::http::HeaderValue> {
    Ok(hyper::http::HeaderValue::from_str(
        mime_type.to_string().as_str(),
    )?)
}
/**
    Sets the content type of a message response as "text/html".
*/
pub async fn html(message: &mut message::Message) -> result::Result<()> {
    let content_type = mime_to_header(mime::TEXT_HTML_UTF_8)?;
    message
        .response
        .headers_mut()
        .append(hyper::header::CONTENT_TYPE, content_type);
    Ok(())
}
/**
    Guesses the content type of a message based on its extension.
*/
pub async fn guess(message: &mut message::Message) -> result::Result<()> {
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
        None => mime_to_header(mime::TEXT_PLAIN_UTF_8),
    }?;
    message
        .response
        .headers_mut()
        .insert(hyper::header::CONTENT_TYPE, content_type);
    Ok(())
}
