use diesel::Connection;

use self::core::result;
use crate::core;

pub fn connect() -> result::Result<diesel::pg::PgConnection> {
    let url = std::env::var("DATABASE_URL")?;
    Ok(diesel::pg::PgConnection::establish(&url)?)
}
