use std::sync::Arc;

use crate::core::context::Context;

pub struct JuniperContext {
    // pub message: Arc<RwLock<Message>>,
    pub global: Arc<Context>,
}
impl JuniperContext {
    pub fn new(global: Arc<Context>) -> Self {
        Self { global }
    }
}
impl juniper::Context for JuniperContext {}
