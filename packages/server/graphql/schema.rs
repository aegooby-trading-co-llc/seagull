use diesel::RunQueryDsl;
use juniper::{EmptyMutation, EmptySubscription, FieldResult};
use uuid::Uuid;

use crate::{
    db::{models::User, schema},
    graphql::juniper_context::JuniperContext,
};

pub struct Query;
#[juniper::graphql_object(context = JuniperContext)]
impl Query {
    pub fn penis(context: &mut JuniperContext) -> FieldResult<String> {
        let conn = context.global.connection_pool.clone().get()?;
        diesel::insert_into(schema::users::table)
            .values(&User {
                id: Uuid::new_v4(),
                email: "shaft, head, scrotum, foreskin (gentile)".into(),
                username: "penis".into(),
            })
            .get_result::<User>(&conn)?;
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
