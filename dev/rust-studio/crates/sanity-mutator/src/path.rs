//! The subset of the mutator's JSONPath dialect that Studio writes: attributes, indices (negative
//! ones count from the end), `[_key=="…"]` selectors and `[start:end]` ranges.

use std::fmt;

use serde_json::Value;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum Segment {
    Attr(String),
    Index(i64),
    Key(String),
    Range(Option<i64>, Option<i64>),
}

pub type Path = Vec<Segment>;

impl Segment {
    pub fn attr(name: impl Into<String>) -> Segment {
        Segment::Attr(name.into())
    }

    pub fn key(key: impl Into<String>) -> Segment {
        Segment::Key(key.into())
    }

    pub fn is_index_reference(&self) -> bool {
        !matches!(self, Segment::Attr(_))
    }

    /// The array indices this segment selects in `array`, ascending. Negative indices count from
    /// the end like `interpretNegativeIndex`, so they may still be out of bounds.
    pub fn indices(&self, array: &[Value]) -> Vec<i64> {
        let len = array.len() as i64;
        let resolve = |i: i64| if i < 0 { i + len } else { i };
        match self {
            Segment::Attr(_) => Vec::new(),
            Segment::Index(i) => vec![resolve(*i)],
            Segment::Key(key) => array
                .iter()
                .enumerate()
                .filter(|(_, item)| item.get("_key").and_then(Value::as_str) == Some(key))
                .map(|(i, _)| i as i64)
                .collect(),
            Segment::Range(start, end) => {
                let start = resolve(start.unwrap_or(0));
                let end = resolve(end.filter(|end| *end != 0).unwrap_or(len));
                (start..end).collect()
            }
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub struct ParseError(pub String);

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid path: {}", self.0)
    }
}

pub fn parse(source: &str) -> Result<Path, ParseError> {
    let err = || ParseError(source.to_owned());
    let bytes = source.as_bytes();
    let mut path = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'.' if !path.is_empty() => {
                i += 1;
                if !bytes.get(i).is_some_and(|next| *next != b'.' && *next != b'[') {
                    return Err(err());
                }
            }
            b'[' => {
                let close = source[i..].find(']').map(|offset| i + offset).ok_or_else(err)?;
                let inner = source[i + 1..close].trim();
                path.push(parse_bracket(inner).ok_or_else(err)?);
                i = close + 1;
            }
            _ => {
                let start = i;
                while i < bytes.len() && bytes[i] != b'.' && bytes[i] != b'[' {
                    i += 1;
                }
                let name = &source[start..i];
                if name.is_empty() {
                    return Err(err());
                }
                path.push(Segment::Attr(name.to_owned()));
            }
        }
    }
    Ok(path)
}

fn parse_bracket(inner: &str) -> Option<Segment> {
    if let Some(rest) = inner.strip_prefix("_key") {
        let rest = rest.trim_start().strip_prefix("==")?.trim();
        return unquote(rest).map(Segment::Key);
    }
    if let Some(name) = unquote(inner) {
        return Some(Segment::Attr(name));
    }
    if let Some((start, end)) = inner.split_once(':') {
        let bound = |s: &str| -> Option<Option<i64>> {
            let s = s.trim();
            if s.is_empty() { Some(None) } else { s.parse().ok().map(Some) }
        };
        return Some(Segment::Range(bound(start)?, bound(end)?));
    }
    inner.parse().ok().map(Segment::Index)
}

fn unquote(s: &str) -> Option<String> {
    let quote = s.chars().next().filter(|c| *c == '"' || *c == '\'')?;
    let body = s.strip_prefix(quote)?.strip_suffix(quote)?;
    let mut out = String::with_capacity(body.len());
    let mut chars = body.chars();
    while let Some(c) = chars.next() {
        if c == '\\' {
            out.push(chars.next()?);
        } else {
            out.push(c);
        }
    }
    Some(out)
}

fn is_identifier(name: &str) -> bool {
    let mut chars = name.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_' || c == '$')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '$' || c == '-')
}

/// Formats a path the way `@sanity/util/paths` `toString` does.
pub fn to_string(path: &[Segment]) -> String {
    let mut out = String::new();
    for segment in path {
        match segment {
            Segment::Attr(name) if is_identifier(name) => {
                if !out.is_empty() {
                    out.push('.');
                }
                out.push_str(name);
            }
            Segment::Attr(name) => out.push_str(&format!("[{}]", Value::from(name.as_str()))),
            Segment::Index(i) => out.push_str(&format!("[{i}]")),
            Segment::Key(key) => out.push_str(&format!("[_key=={}]", Value::from(key.as_str()))),
            Segment::Range(start, end) => out.push_str(&format!(
                "[{}:{}]",
                start.map(|s| s.to_string()).unwrap_or_default(),
                end.map(|e| e.to_string()).unwrap_or_default()
            )),
        }
    }
    out
}

/// The path as the array `@sanity/types` uses on the wire, as in presence locations:
/// `["body", {"_key": "a"}, "children", 0]`.
pub fn to_json(path: &[Segment]) -> Value {
    Value::Array(
        path.iter()
            .map(|segment| match segment {
                Segment::Attr(name) => Value::from(name.as_str()),
                Segment::Index(i) => Value::from(*i),
                Segment::Key(key) => serde_json::json!({"_key": key}),
                Segment::Range(start, end) => {
                    serde_json::json!([start.unwrap_or(0), end.map_or(Value::from(""), Value::from)])
                }
            })
            .collect(),
    )
}

/// Reads a path in the array form of [`to_json`].
pub fn from_json(value: &Value) -> Option<Path> {
    value
        .as_array()?
        .iter()
        .map(|segment| match segment {
            Value::String(name) => Some(Segment::attr(name.as_str())),
            Value::Number(i) => i.as_i64().map(Segment::Index),
            Value::Object(map) => map.get("_key").and_then(Value::as_str).map(Segment::key),
            Value::Array(range) => {
                let bound = |value: Option<&Value>| value.and_then(Value::as_i64);
                Some(Segment::Range(bound(range.first()), bound(range.get(1))))
            }
            _ => None,
        })
        .collect()
}

/// Reads the value at `path`, following keys and indices.
pub fn get<'a>(value: &'a Value, path: &[Segment]) -> Option<&'a Value> {
    let mut current = value;
    for segment in path {
        current = match (segment, current) {
            (Segment::Attr(name), Value::Object(map)) => map.get(name)?,
            (Segment::Index(_) | Segment::Key(_), Value::Array(items)) => {
                let index = *segment.indices(items).first()?;
                items.get(usize::try_from(index).ok()?)?
            }
            _ => return None,
        };
    }
    Some(current)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_studio_paths() {
        for source in [
            "title",
            "author._ref",
            "body[0].children[_key==\"abc\"].text",
            "tags[-1]",
            "items[1:3]",
            "items[2:]",
            "[\"weird key\"].x",
        ] {
            let path = parse(source).unwrap();
            assert_eq!(to_string(&path), source, "{source}");
        }
        assert_eq!(parse("a[_key=='k'].b").unwrap(), vec![Segment::attr("a"), Segment::key("k"), Segment::attr("b")]);
        assert!(parse("a[").is_err());
        assert!(parse("a..b").is_err());
    }

    #[test]
    fn round_trips_wire_paths() {
        let path = parse("body[_key==\"b\"].children[0].text").unwrap();
        let json = to_json(&path);
        assert_eq!(json, serde_json::json!(["body", {"_key": "b"}, "children", 0, "text"]));
        assert_eq!(from_json(&json), Some(path));
        assert_eq!(from_json(&serde_json::json!([true])), None);
    }

    #[test]
    fn reads_values() {
        let doc = serde_json::json!({"a": [{"_key": "x", "b": 1}, {"_key": "y", "b": 2}]});
        assert_eq!(get(&doc, &parse("a[_key==\"y\"].b").unwrap()), Some(&Value::from(2)));
        assert_eq!(get(&doc, &parse("a[-2].b").unwrap()), Some(&Value::from(1)));
        assert_eq!(get(&doc, &parse("a[5].b").unwrap()), None);
    }
}
