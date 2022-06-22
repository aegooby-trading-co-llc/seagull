pub fn err(message: &'static str) -> anyhow::Error {
    anyhow::anyhow!(message)
}
