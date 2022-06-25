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

async fn __render_react(entry: &'static str) -> Result<Buffer> {
    let path = env::current_dir()?.join(entry);
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

#[tokio::main]
pub async fn render_react(entry: &'static str) -> Result<Buffer> {
    __render_react(entry).await
}

#[cfg(test)]
mod test {
    use super::__render_react;
    use crate::core::result::Result;

    #[tokio::test]
    async fn js_runtime_stream() -> Result<()> {
        let buffer = __render_react("renderer/embedded/test.mjs").await?;
        assert!(buffer.bytes().len() > 0);
        Ok(())
    }
}
