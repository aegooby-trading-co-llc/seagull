use std::{borrow::Cow, rc::Rc, task::Poll};

use deno_core::{AsyncRefCell, RcRef, Resource, ZeroCopyBuf};
use tokio::io::{AsyncRead, BufReader};

use crate::core::result::Result;

#[derive(Clone, Debug)]
pub struct Buffer(Vec<u8>);
impl Buffer {
    pub fn new(vector: Vec<u8>) -> Self {
        Self(vector)
    }
    pub fn bytes(&self) -> &Vec<u8> {
        return &self.0;
    }
}
impl AsyncRead for Buffer {
    fn poll_read(
        mut self: std::pin::Pin<&mut Self>,
        _cx: &mut std::task::Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        let amt = std::cmp::min(self.0.len(), buf.remaining());
        let (first, second) = self.0.split_at(amt);
        buf.put_slice(first);
        *self = Buffer(second.to_vec());
        Poll::Ready(Ok(()))
    }
}

#[derive(Debug)]
pub struct ByteStream {
    inner: AsyncRefCell<BufReader<Buffer>>,
}
impl ByteStream {
    pub fn new() -> Self {
        let reader = BufReader::<Buffer>::new(Buffer::new(vec![]));
        Self {
            inner: reader.into(),
        }
    }
    pub fn name() -> String {
        return "ByteStream".into();
    }
    async fn write(self: Rc<Self>, buffer: ZeroCopyBuf) -> Result<usize> {
        let mut inner = RcRef::map(self, |stream| &stream.inner).borrow_mut().await;
        inner.get_mut().0.extend_from_slice(&buffer);
        Ok(buffer.len())
    }
    pub async fn consume(self: Rc<Self>) -> Result<Vec<u8>> {
        let inner = RcRef::map(self, |stream| &stream.inner).borrow().await;
        Ok(inner.get_ref().bytes().clone())
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
