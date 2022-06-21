use std::env;

use diesel::{pg::PgConnection, Connection};

use crate::core::result::Result;

pub fn connect() -> Result<PgConnection> {
    let url = env::var("DATABASE_URL")?;
    Ok(PgConnection::establish(&url)?)
}
