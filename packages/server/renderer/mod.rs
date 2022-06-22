pub mod ops;
pub mod resources;
pub mod runtime;

#[cfg(test)]
mod test {
    use deno_core::{op, OpState, ResourceId};
    use tokio::sync::Mutex;

    use super::{ops::op_create_stream, runtime::JSRuntime};
    use crate::{
        core::result::Result,
        renderer::resources::{Buffer, ByteStream},
    };

    use std::{cell::RefCell, env, rc::Rc};

    lazy_static::lazy_static! {
        static ref STREAM: Mutex<Buffer> = Mutex::new(Buffer::new(vec![]));
    }

    #[tokio::test]
    async fn js_runtime_stream() -> Result<()> {
        #[op]
        pub async fn op_create_stream(state: Rc<RefCell<OpState>>) -> Result<ResourceId> {
            let stream = ByteStream::new();
            let rid = state.borrow_mut().resource_table.add(stream);
            Ok(rid)
        }
        #[op]
        pub async fn op_consume_stream(state: Rc<RefCell<OpState>>, rid: ResourceId) -> Result<()> {
            let stream = state.borrow().resource_table.get::<ByteStream>(rid)?;
            let consumed = stream.consume().await?;
            STREAM.lock().await.extend(consumed);
            Ok(())
        }

        let path = env::current_dir()?.join("renderer/embedded/index.mjs");
        let mut js_runtime = JSRuntime::new(
            &path,
            vec![op_create_stream::decl(), op_consume_stream::decl()],
        )?;
        js_runtime.run(&path).await?;

        assert!(STREAM.lock().await.bytes().len() > 0);

        Ok(())
    }
}
