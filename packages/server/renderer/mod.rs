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

#[tokio::main]
pub async fn render_react() -> Result<Buffer> {
    let path = env::current_dir()?.join("packages/server/renderer/embedded/index.mjs");
    let mut js_worker = JSWorker::new(&path, vec![op_create_stream::decl()], false)?;

    // Right now, if there's an error in JS execution of SSR,
    // it seems possible to just ignore the error and get the
    // right result. Who knows if this will always work though.
    match js_worker.run(&path).await {
        Ok(()) => (),
        // @todo: see if there's a way to fix JS error
        Err(_error) => (),
    }

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
        let mut js_worker = JSWorker::new(&path, vec![op_create_stream::decl()], true)?;
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
