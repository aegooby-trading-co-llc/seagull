use crate::core::error::Error;

/**
    So you don't have to type in Result<_, error::Error> every
    g-d damn time.
*/
pub type Result<T> = std::result::Result<T, Error>;
