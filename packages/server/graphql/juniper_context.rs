use std::sync::{Arc, RwLock};

use crate::core::{context::Context, message::Message};

pub struct JuniperContext {
    pub message: Arc<RwLock<Message>>,
    pub global: Context,
}
impl JuniperContext {
    pub fn new(message: Arc<RwLock<Message>>, global: Context) -> Self {
        Self { message, global }
    }
}
impl juniper::Context for JuniperContext {}
