/**
    So you don't have to type in Result<_, Error> every
    g-d damn time.
*/
pub type Result<T> = std::result::Result<T, anyhow::Error>;
