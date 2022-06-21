pub struct Query;
#[juniper::graphql_object()]
impl Query {
    pub fn penis() -> juniper::FieldResult<String> {
        Ok("penile world".to_string())
    }
}
