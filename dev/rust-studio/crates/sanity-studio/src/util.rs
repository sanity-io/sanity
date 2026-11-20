//! Small browser helpers: storage, ids, time, yielding to the main thread.

use std::cell::Cell;

use js_sys::Reflect;
use serde_json::Value;
use wasm_bindgen::{JsCast, JsValue};

pub fn local_storage() -> Option<web_sys::Storage> {
    web_sys::window()?.local_storage().ok().flatten()
}

pub fn storage_get(key: &str) -> Option<String> {
    local_storage()?.get_item(key).ok().flatten()
}

pub fn storage_set(key: &str, value: &str) {
    if let Some(storage) = local_storage() {
        let _ = storage.set_item(key, value);
    }
}

pub fn storage_remove(key: &str) {
    if let Some(storage) = local_storage() {
        let _ = storage.remove_item(key);
    }
}

pub fn uuid() -> String {
    web_sys::window()
        .and_then(|window| window.crypto().ok())
        .map(|crypto| crypto.random_uuid())
        .unwrap_or_else(|| sanity_client::random_key(32))
}

/// Milliseconds since navigation start.
pub fn now_ms() -> f64 {
    web_sys::window().and_then(|window| window.performance()).map_or(0.0, |performance| performance.now())
}

/// Background work runs for at most this long between yields to the main thread, so a frame or a
/// key press waits behind one slice at most.
const SLICE_MS: f64 = 5.0;

thread_local! {
    static SLICE_START: Cell<f64> = const { Cell::new(0.0) };
}

/// Whether background work has run for a slice since it last yielded.
pub fn slice_expired() -> bool {
    now_ms() - SLICE_START.get() >= SLICE_MS
}

/// Yields to the main thread and resumes once rendering and input are done with it: in a
/// `scheduler.postTask` task of background priority, and in a message task where the browser has
/// no scheduler (a timer would be clamped to 4 ms).
pub async fn yield_to_main() {
    let mut channel = None;
    let promise = js_sys::Promise::new(&mut |resolve, _| {
        let Some(window) = web_sys::window() else {
            let _ = resolve.call0(&JsValue::NULL);
            return;
        };
        let scheduler = Reflect::get(&window, &"scheduler".into()).ok().filter(|scheduler| scheduler.is_object());
        let post_task = scheduler.as_ref().and_then(|scheduler| {
            Reflect::get(scheduler, &"postTask".into()).ok()?.dyn_into::<js_sys::Function>().ok()
        });
        if let (Some(scheduler), Some(post_task)) = (scheduler, post_task) {
            let options = js_sys::Object::new();
            let _ = Reflect::set(&options, &"priority".into(), &"background".into());
            if post_task.call2(&scheduler, &resolve, &options).is_ok() {
                return;
            }
        }
        match web_sys::MessageChannel::new() {
            Ok(messages) => {
                messages.port1().set_onmessage(Some(&resolve));
                let _ = messages.port2().post_message(&JsValue::NULL);
                // Held until the message arrives, so the ports are not collected before.
                channel = Some(messages);
            }
            Err(_) => {
                let _ = resolve.call0(&JsValue::NULL);
            }
        }
    });
    let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
    drop(channel);
    SLICE_START.set(now_ms());
}

pub fn draft_id(id: &str) -> String {
    format!("drafts.{}", published_id(id))
}

pub fn published_id(id: &str) -> &str {
    if let Some(published) = id.strip_prefix("drafts.") {
        return published;
    }
    id.strip_prefix("versions.").and_then(|rest| rest.split_once('.')).map_or(id, |(_, published)| published)
}

pub fn version_id(release: &str, id: &str) -> String {
    format!("versions.{release}.{}", published_id(id))
}

/// The release a version id belongs to: `r1` for `versions.r1.abc`.
pub fn release_of(id: &str) -> Option<&str> {
    id.strip_prefix("versions.")?.split_once('.').map(|(release, _)| release)
}

pub fn session_storage() -> Option<web_sys::Storage> {
    web_sys::window()?.session_storage().ok().flatten()
}

/// `35,592` for 35592.
/// The size of the module's linear memory, which only grows.
pub fn wasm_memory() -> f64 {
    wasm_bindgen::memory()
        .dyn_into::<js_sys::WebAssembly::Memory>()
        .ok()
        .and_then(|memory| memory.buffer().dyn_into::<js_sys::ArrayBuffer>().ok())
        .map_or(0.0, |buffer| buffer.byte_length() as f64)
}

pub fn group_digits(value: usize) -> String {
    let digits = value.to_string();
    let mut out = String::with_capacity(digits.len() + digits.len() / 3);
    for (index, digit) in digits.chars().enumerate() {
        if index > 0 && (digits.len() - index).is_multiple_of(3) {
            out.push(',');
        }
        out.push(digit);
    }
    out
}

/// "just now", "5 min ago", "3 days ago", … for an ISO timestamp.
pub fn time_ago(iso: &str) -> String {
    let then = js_sys::Date::parse(iso);
    if then.is_nan() {
        return String::new();
    }
    let seconds = ((js_sys::Date::now() - then) / 1000.0).max(0.0);
    let (value, unit) = match seconds {
        s if s < 60.0 => return "just now".into(),
        s if s < 3600.0 => (s / 60.0, "min"),
        s if s < 86_400.0 => (s / 3600.0, "hr"),
        s if s < 2_592_000.0 => (s / 86_400.0, "day"),
        s if s < 31_536_000.0 => (s / 2_592_000.0, "month"),
        s => (s / 31_536_000.0, "year"),
    };
    let value = value.floor() as u64;
    let plural = if value == 1 || unit == "min" || unit == "hr" { "" } else { "s" };
    format!("{value} {unit}{plural} ago")
}

/// `startCase` for type and field names without a title: `publicationYear` → `Publication Year`.
pub fn start_case(name: &str) -> String {
    let chars: Vec<char> = name.chars().collect();
    let mut words: Vec<String> = Vec::new();
    let mut word = String::new();
    for (index, &c) in chars.iter().enumerate() {
        if !c.is_alphanumeric() {
            words.extend((!word.is_empty()).then(|| std::mem::take(&mut word)));
            continue;
        }
        let boundary = index > 0 && !word.is_empty() && {
            let previous = chars[index - 1];
            let next_lower = chars.get(index + 1).is_some_and(|next| next.is_lowercase());
            (previous.is_lowercase() && c.is_uppercase())
                || (previous.is_alphabetic() && c.is_numeric())
                || (previous.is_numeric() && c.is_alphabetic())
                || (previous.is_uppercase() && c.is_uppercase() && next_lower)
        };
        if boundary {
            words.push(std::mem::take(&mut word));
        }
        word.push(c);
    }
    words.extend((!word.is_empty()).then_some(word));
    words
        .iter()
        .map(|word| {
            let mut chars = word.chars();
            chars.next().map(|first| first.to_uppercase().chain(chars).collect::<String>()).unwrap_or_default()
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// A short string for any value, for previews of non-string titles.
pub fn preview_text(value: &Value) -> Option<String> {
    match value {
        Value::Null => None,
        Value::String(text) if text.trim().is_empty() => None,
        Value::String(text) => Some(text.clone()),
        Value::Number(number) => Some(number.to_string()),
        Value::Bool(flag) => Some(flag.to_string()),
        Value::Array(items) => {
            // Portable Text, or an internationalized array of `{value}` entries
            let text: Vec<String> = items
                .iter()
                .filter_map(|item| {
                    if let Some(children) = item.get("children").and_then(Value::as_array) {
                        Some(
                            children
                                .iter()
                                .filter_map(|span| span.get("text").and_then(Value::as_str))
                                .collect::<String>(),
                        )
                    } else {
                        item.get("value").and_then(preview_text).or_else(|| preview_text(item))
                    }
                })
                .filter(|text| !text.is_empty())
                .collect();
            (!text.is_empty()).then(|| text.join(" "))
        }
        Value::Object(map) => map
            .get("current")
            .or_else(|| map.get("title"))
            .or_else(|| map.get("name"))
            .or_else(|| map.values().find(|value| value.is_string()))
            .and_then(preview_text),
    }
}

/// Splits a search query into tokens at whitespace outside of double quotes.
fn search_tokens(query: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut token = String::new();
    let mut quoted = false;
    for char in query.chars() {
        if char == '"' {
            quoted = !quoted;
        }
        if char.is_whitespace() && !quoted {
            if !token.is_empty() {
                tokens.push(std::mem::take(&mut token));
            }
        } else {
            token.push(char);
        }
    }
    if !token.is_empty() {
        tokens.push(token);
    }
    tokens
}

/// A search query whose last word matches as a prefix, so results show up while typing (port of
/// `prefixLast` from the JS studio's search). Negated and quoted tokens stay as they are.
pub fn prefix_last(query: &str) -> String {
    let mut tokens = search_tokens(query);
    if tokens.is_empty() {
        return "*".to_owned();
    }
    let is_plain = |token: &String| !token.starts_with('-') && !(token.starts_with('"') && token.ends_with('"'));
    if let Some(last) = tokens.iter_mut().rev().find(|token| is_plain(token))
        && !last.ends_with('*')
    {
        last.push('*');
    }
    tokens.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefixes_the_last_plain_search_token() {
        assert_eq!(prefix_last(""), "*");
        assert_eq!(prefix_last("aristotle"), "aristotle*");
        assert_eq!(prefix_last("  greek   philo "), "greek philo*");
        assert_eq!(prefix_last("philo -poetry"), "philo* -poetry");
        assert_eq!(prefix_last(r#"philo "on poetry""#), r#"philo* "on poetry""#);
        assert_eq!(prefix_last("philo*"), "philo*");
        assert_eq!(prefix_last(r#""on poetry""#), r#""on poetry""#);
    }

    #[test]
    fn reads_published_ids_of_drafts_and_versions() {
        assert_eq!(published_id("drafts.a"), "a");
        assert_eq!(published_id("versions.r1.a"), "a");
        assert_eq!(published_id("versions.r1.a.b"), "a.b");
        assert_eq!(published_id("a"), "a");
        assert_eq!(version_id("r1", "drafts.a"), "versions.r1.a");
        assert_eq!(release_of("versions.r1.a.b"), Some("r1"));
        assert_eq!(release_of("drafts.a"), None);
    }

    #[test]
    fn groups_digits_in_thousands() {
        assert_eq!(group_digits(0), "0");
        assert_eq!(group_digits(999), "999");
        assert_eq!(group_digits(35_592), "35,592");
        assert_eq!(group_digits(1_234_567), "1,234,567");
    }

    #[test]
    fn start_case_matches_lodash() {
        assert_eq!(start_case("publicationYear"), "Publication Year");
        assert_eq!(start_case("pt_allTheBellsAndWhistles"), "Pt All The Bells And Whistles");
        assert_eq!(start_case("v3-example1"), "V 3 Example 1");
        assert_eq!(start_case("sanity.videoAsset"), "Sanity Video Asset");
        assert_eq!(start_case("HTMLParser"), "HTML Parser");
        assert_eq!(start_case("book2"), "Book 2");
    }

    #[test]
    fn previews_text_from_portable_text() {
        let blocks = serde_json::json!([{"_type": "block", "children": [{"text": "Hello "}, {"text": "world"}]}]);
        assert_eq!(preview_text(&blocks).as_deref(), Some("Hello world"));
        assert_eq!(preview_text(&serde_json::json!({"_type": "slug", "current": "a-b"})).as_deref(), Some("a-b"));
    }
}
