use std::{error, fmt};

/**
    General error type that errors from other libraries will be converted to.
*/
#[derive(Clone, Debug)]
pub enum Error {
    Message(String),
}
impl Error {
    pub fn new(message: &str) -> Self {
        Self::Message(message.to_string())
    }
}
impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::Message(message) => write!(formatter, "{}", message),
        }
    }
}
impl<ErrorType: error::Error> From<ErrorType> for Error {
    fn from(error: ErrorType) -> Self {
        Self::new(&format!("{:#?}", error))
    }
}
