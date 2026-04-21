use bcrypt::{hash, verify, DEFAULT_COST};
use anyhow::Result;

pub fn hash_password(password: &str) -> Result<String> {
    let hashed = hash(password, DEFAULT_COST)?;
    Ok(hashed)
}

pub fn verify_password(password: &str, hashed: &str) -> Result<bool> {
    let is_valid = verify(password, hashed)?;
    Ok(is_valid)
}