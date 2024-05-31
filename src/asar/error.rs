use std::convert::From;
use std::error;
use std::fmt;
use std::io;
use std::num::ParseIntError;

/// Enum of all possible errors during manipulation of asar archives.
#[derive(Debug)]
pub enum Error {
    Io(io::Error),
    Value(ParseIntError),
    Json(serde_json::Error),
    Glob(glob::GlobError),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::Io(ref err) => write!(f, "IO Error: {}", err),
            Error::Value(ref err) => write!(f, "Error parsing int: {}", err),
            Error::Json(ref err) => write!(f, "Error parsing JSON: {}", err),
            Error::Glob(ref err) => write!(f, "Error parsing glob: {}", err),
        }
    }
}

impl error::Error for Error {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match self {
            Error::Io(ref err) => Some(err),
            Error::Value(ref err) => Some(err),
            Error::Json(ref err) => Some(err),
            Error::Glob(ref err) => Some(err),
        }
    }
}

impl From<io::Error> for Error {
    fn from(err: io::Error) -> Self { Error::Io(err) }
}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self { Error::Json(err) }
}

impl From<glob::GlobError> for Error {
    fn from(err: glob::GlobError) -> Self { Error::Glob(err) }
}

impl From<ParseIntError> for Error {
    fn from(err: ParseIntError) -> Self { Error::Value(err) }
}
