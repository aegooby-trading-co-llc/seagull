fn main() {
    let re = regex::Regex::new(r"^\d{4}-\d{2}-\d{2}$").unwrap();
    println!("Did our penis match? {}", re.is_match("2014-01-01"));
}
