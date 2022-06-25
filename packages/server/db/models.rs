use crate::db::pg_schema;

use uuid::Uuid;

use pg_schema::users;

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
