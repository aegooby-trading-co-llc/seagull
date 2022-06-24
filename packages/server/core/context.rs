use std::sync::Arc;

use diesel::{
    r2d2::{ConnectionManager, Pool},
    PgConnection,
};
use juniper::RootNode;

use crate::{
    core::result::Result,
    db::pool::create_pool,
    graphql::schema::{Mutation, Query, Subscription},
};

/**
    Contains things like database connections and idk some other shit.
*/
#[derive(Clone)]
pub struct Context {
    pub graphql_root_node: Arc<RootNode<'static, Query, Mutation, Subscription>>,
    pub connection_pool: Pool<ConnectionManager<PgConnection>>,
}
impl Context {
    pub fn new() -> Result<Self> {
        Ok(Self {
            graphql_root_node: Arc::new(RootNode::new(
                Query::new(),
                Mutation::new(),
                Subscription::new(),
            )),
            connection_pool: create_pool()?,
        })
    }
}
