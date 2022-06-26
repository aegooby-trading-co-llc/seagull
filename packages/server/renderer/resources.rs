use std::{borrow::Cow, rc::Rc};

use bytes::BytesMut;
use deno_core::{AsyncRefCell, RcRef, Resource, ZeroCopyBuf};

use crate::core::result::Result;

#[derive(Debug)]
pub struct ByteStream {
    inner: AsyncRefCell<BytesMut>,
}
impl ByteStream {
    pub fn new() -> Self {
        Self {
            inner: BytesMut::new().into(),
        }
    }
    pub fn name() -> String {
        return "ByteStream".into();
    }
    async fn write(self: Rc<Self>, buffer: ZeroCopyBuf) -> Result<usize> {
        let mut inner = RcRef::map(self, |stream| &stream.inner).borrow_mut().await;
        inner.extend_from_slice(&buffer);
        Ok(buffer.len())
    }
    pub async fn consume(self: Rc<Self>) -> Result<BytesMut> {
        let inner = RcRef::map(self, |stream| &stream.inner).borrow().await;
        Ok(inner.clone())
    }
}
impl Resource for ByteStream {
    fn write(self: Rc<Self>, buffer: ZeroCopyBuf) -> deno_core::AsyncResult<usize> {
        Box::pin(self.write(buffer))
    }
    fn name(&self) -> Cow<str> {
        Self::name().into()
    }
}
