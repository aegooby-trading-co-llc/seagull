use crate::graphql::schema;

/**
    Contains things like database connections and idk some other shit.
*/
#[derive(Clone)]
pub struct Context {
    pub graphql_root_node: std::sync::Arc<
        juniper::RootNode<'static, schema::Query, schema::Mutation, schema::Subscription>,
    >,
}
impl Context {
    pub fn new() -> Self {
        Self {
            graphql_root_node: std::sync::Arc::new(juniper::RootNode::new(
                schema::Query::new(),
                schema::Mutation::new(),
                schema::Subscription::new(),
            )),
        }
    }
}
