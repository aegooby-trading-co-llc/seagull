use crate::db::schema;

use uuid::Uuid;

use schema::users;

#[derive(Queryable, Insertable)]
#[table_name = "users"]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
}

// #[derive(Insertable)]
// #[table_name = "users"]
// pub struct NewUser {
//     pub email: String,
//     pub username: String,
// }
