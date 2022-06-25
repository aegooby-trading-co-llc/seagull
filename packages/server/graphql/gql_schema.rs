use diesel::RunQueryDsl;
use juniper::{EmptyMutation, EmptySubscription, FieldResult};
use uuid::Uuid;

use crate::{
    db::{models::User, pg_schema},
    graphql::juniper_context::JuniperContext,
};

pub struct Query;
#[juniper::graphql_object(context = JuniperContext)]
impl Query {
    pub fn penis() -> FieldResult<String> {
        Ok("penile world".to_string())
    }
}
impl Query {
    pub fn new() -> Self {
        Self {}
    }
}

pub type Mutation = EmptyMutation<JuniperContext>;
pub type Subscription = EmptySubscription<JuniperContext>;
