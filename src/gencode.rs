use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

const LICENSE_CHARS: &str = "L23456789ABCDEFGHJKMNPQRSTUVWXYZ";
static COUNTER: AtomicUsize = AtomicUsize::new(0);

pub fn license() -> String {
    let length = 22;
    let chars: Vec<char> = LICENSE_CHARS.chars().collect();
    let mut result = String::with_capacity(length);

    for _ in 0..length {
        let mut seed = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos() as usize;
        seed ^= COUNTER.fetch_add(1, Ordering::SeqCst);
        let index = seed % chars.len();
        result.push(chars[index]);
    }

    for n in 0..2 {
        let mut o = 0;
        for i in (0..16).step_by(2) {
            o += LICENSE_CHARS.find(&result[n + i..=n + i]).unwrap();
        }
        o %= LICENSE_CHARS.len();
        result.push(chars[o]);
    }

    result.insert(6, '-');
    result.insert(13, '-');
    result.insert(20, '-');

    result
}
