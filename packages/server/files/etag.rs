use self::core::{message, Result};
use crate::core;

use std::{fs::Metadata, str::FromStr, time::UNIX_EPOCH};

/**
    Calculates an ETag based on when it was last modified.
*/
fn calculate(metadata: &Metadata) -> String {
    fn parse_modified(metadata: &Metadata) -> String {
        match metadata.modified() {
            Ok(modified) => {
                if let Ok(duration) = modified.duration_since(UNIX_EPOCH) {
                    let time = duration.as_secs();
                    format!("{:#x}", time)
                } else {
                    "0".to_string()
                }
            }
            Err(_error) => "0".to_string(),
        }
    }
    fn parse_size(metadata: &Metadata) -> String {
        format!("{:#x}", metadata.len())
    }
    let modified = parse_modified(metadata);
    let size = parse_size(metadata);
    format!("W/{}-{}", size, modified)
}
/**
    Uh... I know what this does. 100%. This checks... uh... if none match.
    Yes. I didn't copy paste any of this. Why would I do that? Fuck you.
*/
fn if_none_match(value: &str, etag: &str) -> bool {
    if value.trim() == "*" {
        false
    } else {
        value.contains(etag)
    }
}

/**
    Generates an ETag for a message containing a static file. An ETag is kind of
    like a file hash, a way of identifying file uniqueness so that the browser cache
    updates things when a file with the same name is updated.
*/
pub fn generate(message: &mut message::Message, metadata: &std::fs::Metadata) -> Result<()> {
    let mut mtime = None as Option<u64>;
    if let Some(header) = message.response.headers().get(hyper::header::LAST_MODIFIED) {
        if let Ok(header_str) = header.to_str() {
            if let Ok(last_modified) = header_str.parse() {
                mtime = Some(last_modified)
            }
        }
    } else if let Ok(modified) = metadata.modified() {
        let last_modified = modified.duration_since(std::time::UNIX_EPOCH)?.as_secs();
        mtime = Some(last_modified);
        let value = hyper::header::HeaderValue::from_str(last_modified.to_string().as_str())?;
        message
            .response
            .headers_mut()
            .insert(hyper::header::LAST_MODIFIED, value);
    }

    if !message
        .response
        .headers()
        .contains_key(hyper::header::CACHE_CONTROL)
    {
        let value = hyper::header::HeaderValue::from_static("max-age=0");
        message
            .response
            .headers_mut()
            .append(hyper::header::CACHE_CONTROL, value);
    }
    if let Some(value) = message.response.headers().get(hyper::header::IF_NONE_MATCH) {
        if mtime.is_some() {
            if let Ok(value) = value.to_str() {
                let etag = calculate(&metadata);
                if !if_none_match(&value.to_string(), &etag) {
                    let value = hyper::header::HeaderValue::from_str(etag.as_str())?;
                    message
                        .response
                        .headers_mut()
                        .append(hyper::header::ETAG, value);
                    *message.response.status_mut() = hyper::StatusCode::NOT_MODIFIED;
                }
            }
        }
    }
    if let Some(value) = message
        .response
        .headers()
        .get(hyper::header::IF_MODIFIED_SINCE)
    {
        if let Some(mtime) = mtime {
            if let Ok(value) = value.to_str() {
                let date = chrono::DateTime::<chrono::Utc>::from_str(value)?;
                if date.timestamp() as u64 > mtime {
                    *message.response.status_mut() = hyper::StatusCode::NOT_MODIFIED;
                }
            }
        }
    }
    Ok(())
}
