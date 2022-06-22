use std::{cell::RefCell, rc::Rc};

use deno_core::{op, OpState, ResourceId};

use crate::{core::result::Result, renderer::resources::ByteStream};

#[op]
pub fn op_create_stream(state: Rc<RefCell<OpState>>) -> Result<ResourceId> {
    let stream = ByteStream::new();
    let rid = state.borrow_mut().resource_table.add(stream);
    Ok(rid)
}
