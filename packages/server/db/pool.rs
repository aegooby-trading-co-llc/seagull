use std::env;

use diesel::{
    pg::PgConnection,
    r2d2::{ConnectionManager, Pool},
};

use crate::core::Result;

pub fn create_pool() -> Result<Pool<ConnectionManager<PgConnection>>> {
    let url = env::var("DATABASE_URL")?;
    let manager = ConnectionManager::<PgConnection>::new(&url);
    Ok(Pool::builder().build(manager)?)
}
