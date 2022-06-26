use bytes::{Bytes, BytesMut};
use tokio::task::spawn_blocking;

use crate::core::{error::err, result::Result};
use std::env;

use self::{ops::op_create_stream, resources::ByteStream, worker::JsWorker};

pub mod ops;
pub mod resources;
pub mod worker;

pub struct ReactRenderer;
impl ReactRenderer {
    async fn js_worker(entry: &'static str, args: Vec<String>) -> Result<Bytes> {
        let path = env::current_dir()?.join(entry);
        let mut js_worker = JsWorker::new(&path, vec![op_create_stream::decl()], args, false)?;
        js_worker.run(&path).await?;

        match js_worker.resources().get(&ByteStream::name()) {
            Some(rid) => {
                let bytes = js_worker
                    .get_resource::<ByteStream>(*rid)?
                    .consume()
                    .await?;
                Ok(bytes.into())
            }
            None => Err(err("RID not found for stream")),
        }
    }

    #[tokio::main]
    async fn runtime(entry: &'static str, args: Vec<String>) -> Result<Bytes> {
        Self::js_worker(entry, args).await
    }

    pub async fn render(entry: &'static str, args: Vec<String>) -> Result<Bytes> {
        spawn_blocking(|| Self::runtime(entry, args)).await?
    }
}

#[cfg(test)]
mod test {
    use super::ReactRenderer;
    use crate::core::result::Result;

    #[tokio::test]
    async fn render_stream() -> Result<()> {
        let buffer = ReactRenderer::js_worker("renderer/embedded/test.mjs", vec![]).await?;
        assert!(buffer.len() > 0);
        Ok(())
    }
}

#[cfg(test)]
mod bench {
    extern crate test;

    use std::process::Termination;
    use test::Bencher;
    use tokio::runtime::Runtime;

    use super::ReactRenderer;

    #[bench]
    fn embedded(bencher: &mut Bencher) -> impl Termination {
        bencher.iter(|| {
            Runtime::new()?.block_on(async {
                ReactRenderer::js_worker("renderer/embedded/test.mjs", vec![]).await
            })
        })
    }
}
