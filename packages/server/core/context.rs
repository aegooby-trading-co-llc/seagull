use std::sync::Arc;

use diesel::{
    r2d2::{ConnectionManager, Pool},
    PgConnection,
};
use juniper::RootNode;
use tokio::{fs::File, io::AsyncWriteExt};

use crate::{
    core::result::Result,
    db::pool::create_pool,
    graphql::gql_schema::{Mutation, Query, Subscription},
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
    pub async fn write_files(&self) -> Result<()> {
        let mut file = File::create("graphql/schema.gql").await?;
        file.write(self.graphql_root_node.as_schema_language().as_bytes())
            .await?;
        Ok(())
    }
}
