use crate::core::{error::err, result::Result};
use std::env;

use self::{
    ops::op_create_stream,
    resources::{Buffer, ByteStream},
    worker::JSWorker,
};

pub mod ops;
pub mod resources;
pub mod worker;

pub async fn render_react() -> Result<Buffer> {
    let path = env::current_dir()?.join("renderer/embedded/index.mjs");
    let mut js_worker = JSWorker::new(&path, vec![op_create_stream::decl()])?;
    js_worker.run(&path).await?;

    match js_worker.resources().get(&ByteStream::name()) {
        Some(rid) => {
            let bytes = js_worker
                .get_resource::<ByteStream>(*rid)?
                .consume()
                .await?;
            Ok(Buffer::new(bytes))
        }
        None => Err(err("RID not found for stream")),
    }
}

#[cfg(test)]
mod test {
    use super::{ops::op_create_stream, worker::JSWorker};
    use crate::{
        core::{error::err, result::Result},
        renderer::resources::ByteStream,
    };

    use std::env;

    #[tokio::test]
    async fn js_runtime_stream() -> Result<()> {
        let path = env::current_dir()?.join("renderer/embedded/index.mjs");
        let mut js_worker = JSWorker::new(&path, vec![op_create_stream::decl()])?;
        js_worker.run(&path).await?;

        match js_worker.resources().get(&ByteStream::name()) {
            Some(rid) => {
                let stream = js_worker.get_resource::<ByteStream>(*rid)?;
                assert!(stream.consume().await?.len() > 0);
                Ok(())
            }
            None => Err(err("RID not found for stream")),
        }
    }
}
