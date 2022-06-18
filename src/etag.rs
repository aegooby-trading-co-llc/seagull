use crate::{message, result};

use std::str::FromStr;

fn calculate(metadata: &std::fs::Metadata) -> String {
    fn parse_modified(metadata: &std::fs::Metadata) -> String {
        match metadata.modified() {
            Ok(modified) => {
                if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                    let time = duration.as_secs();
                    format!("{:#x}", time)
                } else {
                    "0".to_string()
                }
            }
            Err(_error) => "0".to_string(),
        }
    }
    fn parse_size(metadata: &std::fs::Metadata) -> String {
        format!("{:#x}", metadata.len())
    }
    let modified = parse_modified(metadata);
    let size = parse_size(metadata);
    format!("W/{}-{}", size, modified)
}
fn if_none_match(value: &str, etag: &str) -> bool {
    if value.trim() == "*" {
        false
    } else {
        value.contains(etag)
    }
}

pub fn generate(
    message: &mut message::Message,
    metadata: &std::fs::Metadata,
) -> result::Result<()> {
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
