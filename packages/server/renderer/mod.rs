use tokio::task::spawn_blocking;

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

const ACCEPTABLE_ERROR: &'static str = "Uncaught (in promise) Error: operation canceled";

pub struct ReactRenderer;
impl ReactRenderer {
    async fn js_worker(entry: &'static str) -> Result<Buffer> {
        let path = env::current_dir()?.join(entry);
        let mut js_worker = JSWorker::new(&path, vec![op_create_stream::decl()], false)?;

        // Right now, if there's an error in JS execution of SSR,
        // it seems possible to just ignore the error and get the
        // right result. Who knows if this will always work though.
        match js_worker.run(&path).await {
            Ok(()) => (),
            // @todo: see if there's a way to fix JS error
            Err(error) => {
                if format!("{}", error) != ACCEPTABLE_ERROR {
                    return Err(error);
                }
            }
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
    async fn runtime(entry: &'static str) -> Result<Buffer> {
        Self::js_worker(entry).await
    }

    pub async fn render(entry: &'static str) -> Result<Buffer> {
        spawn_blocking(|| Self::runtime(entry)).await?
    }
}

#[cfg(test)]
mod test {
    use super::ReactRenderer;
    use crate::core::result::Result;

    #[tokio::test]
    async fn render_stream() -> Result<()> {
        let buffer = ReactRenderer::js_worker("renderer/embedded/test.mjs").await?;
        assert!(buffer.bytes().len() > 0);
        Ok(())
    }
}

#[cfg(test)]
mod bench {
    extern crate test;

    use hyper::Client;
    use std::process::Termination;
    use test::Bencher;
    use tokio::runtime::Runtime;

    use crate::core::message::Message;

    use super::ReactRenderer;

    #[bench]
    fn embedded(bencher: &mut Bencher) -> impl Termination {
        bencher.iter(|| {
            Runtime::new()?
                .block_on(async { ReactRenderer::js_worker("renderer/embedded/test.mjs").await })
        })
    }

    #[bench]
    fn proxy(bencher: &mut Bencher) -> impl Termination {
        let mut message = Message::default();
        match Runtime::new() {
            Ok(runtime) => bencher.iter(|| {
                runtime.block_on(async {
                    let response = Client::new()
                        .get(("http://localhost:3737/".to_string()).parse()?)
                        .await?;
                    *message.response.body_mut() = response.into_body();
                    anyhow::Ok(())
                })
            }),
            Err(_error) => (),
        }
    }
}
