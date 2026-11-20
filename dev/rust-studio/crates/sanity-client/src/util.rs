use js_sys::{Date, Promise};
use wasm_bindgen_futures::JsFuture;

pub async fn sleep(ms: u32) {
    let promise = Promise::new(&mut |resolve, _| {
        web_sys::window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, ms as i32).unwrap();
    });
    let _ = JsFuture::from(promise).await;
}

pub fn now_iso() -> String {
    String::from(Date::new_0().to_iso_string())
}

/// A random alphanumeric string, like the `_key`s and transaction ids Studio generates.
pub fn random_key(len: usize) -> String {
    const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    (0..len).map(|_| CHARS[(random() * CHARS.len() as f64) as usize % CHARS.len()] as char).collect()
}

#[cfg(target_arch = "wasm32")]
fn random() -> f64 {
    js_sys::Math::random()
}

/// Unit tests run natively, where there is no `Math.random`; every `RandomState` has new keys.
#[cfg(not(target_arch = "wasm32"))]
fn random() -> f64 {
    use std::hash::{BuildHasher, RandomState};
    (RandomState::new().hash_one(()) >> 11) as f64 / (1_u64 << 53) as f64
}
