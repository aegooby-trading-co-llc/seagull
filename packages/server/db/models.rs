use crate::db::schema;

#[derive(Queryable)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
}

use schema::posts;

#[derive(Insertable)]
#[table_name = "posts"]
pub struct NewPost<'lt> {
    pub title: &'lt str,
    pub body: &'lt str,
}
