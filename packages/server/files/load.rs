use axum::body::Body;
use std::path::PathBuf;
use tokio::fs::File;
use tokio_util::io::ReaderStream;

use crate::core::Result;

pub async fn file_to_body(path: &PathBuf) -> Result<Body> {
    let file = File::open(path).await?;
    let stream = ReaderStream::new(file);
    Ok(Body::wrap_stream(stream))
}
