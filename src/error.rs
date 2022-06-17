#[derive(Clone, Debug)]
pub enum Error {
    Message(String),
}
impl Error {
    pub fn new(message: &str) -> Self {
        Self::Message(message.to_string())
    }
}
impl std::fmt::Display for Error {
    fn fmt(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Error::Message(message) => write!(formatter, "{}", message),
        }
    }
}

impl<ErrorType: std::error::Error> From<ErrorType> for Error {
    fn from(error: ErrorType) -> Self {
        Self::new(&format!("{:#?}", error))
    }
}
