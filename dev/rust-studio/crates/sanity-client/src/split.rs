//! Splits a query response, `{"result": [<document>, …], "ms": …}`, into its documents as the
//! bytes arrive, so a page can be processed while it downloads and is never held or parsed whole.
//! A document comes out as its JSON when it is no longer than the limit, and always with the raw
//! JSON of the top-level fields asked for.

use std::collections::VecDeque;

/// Fields larger than this are left out: they are only read for previews and sorting.
const FIELD_LIMIT: usize = 16 * 1024;

#[derive(Debug, PartialEq, Eq)]
pub struct Split {
    /// The document's JSON, `None` when it is longer than the limit.
    pub json: Option<Vec<u8>>,
    /// The length of the document's JSON, in bytes.
    pub len: usize,
    /// The fields asked for that the document has, by index into them, as raw JSON.
    pub fields: Vec<(usize, Vec<u8>)>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Kind {
    Container,
    String,
    Scalar,
}

/// Bytes of a value being read: the document, or a field of it.
struct Value {
    kind: Kind,
    buf: Vec<u8>,
    /// Where the value starts in the chunk being read, `None` once it went over its limit.
    start: Option<usize>,
    len: usize,
    limit: usize,
}

impl Value {
    fn new(kind: Kind, start: usize, limit: usize) -> Value {
        Value { kind, buf: Vec::new(), start: Some(start), len: 0, limit }
    }

    /// Takes the bytes of the value in `chunk` up to `end`.
    fn take(&mut self, chunk: &[u8], end: usize) {
        let from = self.start.unwrap_or(0);
        self.len += end - from;
        if self.start.is_some() {
            if self.buf.len() + end - from > self.limit {
                self.start = None;
                self.buf = Vec::new();
            } else {
                self.buf.extend_from_slice(&chunk[from..end]);
            }
        }
    }

    fn whole(&self) -> bool {
        self.start.is_some()
    }
}

struct Document {
    value: Value,
    fields: Vec<(usize, Vec<u8>)>,
    /// The field of the member being read, when it is one of those asked for.
    member: Option<usize>,
    field: Option<(usize, Value)>,
    object: bool,
    expect_key: bool,
}

pub struct Splitter {
    limit: usize,
    keys: Vec<Vec<u8>>,
    depth: usize,
    string: bool,
    escape: bool,
    scalar: bool,
    /// The bytes of the object key being read, at the response's or a document's top level.
    key: Option<Vec<u8>>,
    root_expect_key: bool,
    root_key: Vec<u8>,
    /// The value after the `result` key is next.
    result_next: bool,
    in_result: bool,
    found_result: bool,
    document: Option<Document>,
    done: VecDeque<Split>,
}

impl Splitter {
    /// Splits documents no longer than `limit` bytes off whole, and reads `fields` of all of them.
    /// Keys are compared as they appear in the response, escapes included, which is exact for
    /// field names, since those cannot contain a quote, a backslash or a control character.
    pub fn new(limit: usize, fields: &[&str]) -> Splitter {
        Splitter {
            limit,
            keys: fields.iter().map(|field| field.as_bytes().to_vec()).collect(),
            depth: 0,
            string: false,
            escape: false,
            scalar: false,
            key: None,
            root_expect_key: false,
            root_key: Vec::new(),
            result_next: false,
            in_result: false,
            found_result: false,
            document: None,
            done: VecDeque::new(),
        }
    }

    /// The next document split off, if any.
    pub fn pop(&mut self) -> Option<Split> {
        self.done.pop_front()
    }

    /// Checks that the response was whole once it ended.
    pub fn finish(&self) -> Result<(), &'static str> {
        if self.depth != 0 || self.string || self.document.is_some() {
            return Err("The query response ended early");
        }
        if !self.found_result {
            return Err("The query result is not an array");
        }
        Ok(())
    }

    /// Reads the next bytes of the response.
    pub fn push(&mut self, chunk: &[u8]) {
        let mut i = 0;
        while i < chunk.len() {
            if self.string {
                if self.escape {
                    self.escape = false;
                    if let Some(key) = &mut self.key {
                        key.push(chunk[i]);
                    }
                    i += 1;
                    continue;
                }
                let rest = &chunk[i..];
                let Some(offset) = rest.iter().position(|byte| *byte == b'"' || *byte == b'\\') else {
                    if let Some(key) = &mut self.key {
                        key.extend_from_slice(rest);
                    }
                    break;
                };
                if let Some(key) = &mut self.key {
                    key.extend_from_slice(&rest[..offset]);
                }
                i += offset;
                if chunk[i] == b'\\' {
                    self.escape = true;
                    if let Some(key) = &mut self.key {
                        key.push(b'\\');
                    }
                } else {
                    self.string = false;
                    self.string_end(chunk, i);
                }
                i += 1;
                continue;
            }
            let byte = chunk[i];
            let structural =
                matches!(byte, b' ' | b'\n' | b'\r' | b'\t' | b',' | b':' | b'{' | b'}' | b'[' | b']' | b'"');
            if self.scalar {
                if !structural {
                    i += 1;
                    continue;
                }
                self.scalar = false;
                self.scalar_end(chunk, i);
            }
            match byte {
                b' ' | b'\n' | b'\r' | b'\t' => {}
                b'"' => {
                    self.value_start(i, Kind::String);
                    self.string = true;
                }
                b'{' | b'[' => {
                    self.value_start(i, Kind::Container);
                    self.depth += 1;
                    self.open(byte);
                }
                b'}' | b']' => {
                    self.depth = self.depth.saturating_sub(1);
                    self.close(chunk, i);
                }
                b',' => self.comma(),
                b':' => self.colon(),
                _ => {
                    self.value_start(i, Kind::Scalar);
                    self.scalar = true;
                }
            }
            i += 1;
        }
        // What the chunk holds of the values being read.
        if let Some(document) = &mut self.document {
            document.value.take(chunk, chunk.len());
            document.value.start = document.value.start.map(|_| 0);
            if let Some((_, field)) = &mut document.field {
                field.take(chunk, chunk.len());
                field.start = field.start.map(|_| 0);
            }
        }
    }

    fn value_start(&mut self, at: usize, kind: Kind) {
        match self.depth {
            1 if self.root_expect_key && kind == Kind::String => {
                self.root_expect_key = false;
                self.key = Some(Vec::new());
            }
            1 if self.result_next => {
                self.result_next = false;
                if kind == Kind::Container {
                    self.in_result = true;
                    self.found_result = true;
                }
            }
            2 if self.in_result && self.document.is_none() => {
                self.document = Some(Document {
                    value: Value::new(kind, at, self.limit),
                    fields: Vec::new(),
                    member: None,
                    field: None,
                    object: false,
                    expect_key: false,
                });
            }
            3 => {
                let Some(document) = &mut self.document else { return };
                if document.expect_key && kind == Kind::String {
                    document.expect_key = false;
                    self.key = Some(Vec::new());
                } else if let Some(index) = document.member.take() {
                    document.field = Some((index, Value::new(kind, at, FIELD_LIMIT)));
                }
            }
            _ => {}
        }
    }

    fn open(&mut self, byte: u8) {
        match self.depth {
            1 => self.root_expect_key = byte == b'{',
            3 => {
                if let Some(document) = &mut self.document {
                    document.object = byte == b'{';
                    document.expect_key = document.object;
                }
            }
            _ => {}
        }
    }

    fn string_end(&mut self, chunk: &[u8], at: usize) {
        if let Some(key) = self.key.take() {
            match self.depth {
                1 => self.root_key = key,
                3 => {
                    if let Some(document) = &mut self.document {
                        document.member = self.keys.iter().position(|wanted| *wanted == key);
                    }
                }
                _ => {}
            }
            return;
        }
        self.value_end(chunk, at + 1, Kind::String);
    }

    fn scalar_end(&mut self, chunk: &[u8], at: usize) {
        self.value_end(chunk, at, Kind::Scalar);
    }

    fn close(&mut self, chunk: &[u8], at: usize) {
        if self.depth == 1 && self.in_result {
            self.in_result = false;
            return;
        }
        self.value_end(chunk, at + 1, Kind::Container);
    }

    /// Ends a field or a document of `kind` that ends before `end` at the current depth.
    fn value_end(&mut self, chunk: &[u8], end: usize, kind: Kind) {
        match self.depth {
            2 => {
                let Some(document) = &mut self.document else { return };
                if document.value.kind != kind {
                    return;
                }
                let mut document = self.document.take().expect("checked above");
                document.value.take(chunk, end);
                self.done.push_back(Split {
                    json: document.value.whole().then_some(document.value.buf),
                    len: document.value.len,
                    fields: document.fields,
                });
            }
            3 => {
                let Some(document) = &mut self.document else { return };
                let Some((_, field)) = &document.field else { return };
                if field.kind != kind {
                    return;
                }
                let (index, mut field) = document.field.take().expect("checked above");
                field.take(chunk, end);
                if field.whole() {
                    document.fields.push((index, field.buf));
                }
            }
            _ => {}
        }
    }

    fn comma(&mut self) {
        match self.depth {
            1 => self.root_expect_key = true,
            3 => {
                if let Some(document) = &mut self.document {
                    document.expect_key = document.object;
                    document.member = None;
                }
            }
            _ => {}
        }
    }

    fn colon(&mut self) {
        if self.depth == 1 {
            self.result_next = self.root_key == b"result";
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const RESPONSE: &str = concat!(
        r#"{"query":"*[\"result\" in tags]{\"result\":1}","#,
        r#""result":[{"_id":"a","_type":"author","name":"Ada \"Lovelace\" \\o/","nested":{"_id":"no","name":"no"},"list":[{"_id":"x"},"]}"],"age":36},"#,
        r#"{"_type":"book","_id":"b","title":{"en":"Æsir ☃"},"n":null,"ok":true,"big":"0123456789012345678901234567890123456789"},"#,
        r#"{"_id":"c"}],"syncTags":["s1"],"ms":3}"#,
    );

    fn splitter() -> Splitter {
        Splitter::new(60, &["_id", "_type", "name", "title", "n", "ok", "age"])
    }

    fn split(chunks: &[&[u8]]) -> Vec<Split> {
        let mut splitter = splitter();
        for chunk in chunks {
            splitter.push(chunk);
        }
        splitter.finish().unwrap();
        std::iter::from_fn(|| splitter.pop()).collect()
    }

    fn fields(split: &Split) -> Vec<(usize, String)> {
        split.fields.iter().map(|(index, raw)| (*index, String::from_utf8(raw.clone()).unwrap())).collect()
    }

    #[test]
    fn splits_documents_and_reads_their_fields() {
        let docs = split(&[RESPONSE.as_bytes()]);
        assert_eq!(docs.len(), 3);
        assert_eq!(docs[0].json, None, "longer than the limit");
        assert_eq!(
            docs[0].len,
            r#"{"_id":"a","_type":"author","name":"Ada \"Lovelace\" \\o/","nested":{"_id":"no","name":"no"},"list":[{"_id":"x"},"]}"],"age":36}"#.len()
        );
        assert_eq!(
            fields(&docs[0]),
            [
                (0, r#""a""#.into()),
                (1, r#""author""#.into()),
                (2, r#""Ada \"Lovelace\" \\o/""#.into()),
                (6, "36".into())
            ]
        );
        assert_eq!(docs[1].json, None);
        assert_eq!(
            fields(&docs[1]),
            [
                (1, r#""book""#.into()),
                (0, r#""b""#.into()),
                (3, r#"{"en":"Æsir ☃"}"#.into()),
                (4, "null".into()),
                (5, "true".into())
            ]
        );
        assert_eq!(docs[2].json.as_deref(), Some(br#"{"_id":"c"}"#.as_slice()));
        assert_eq!(docs[2].len, 11);
        assert_eq!(fields(&docs[2]), [(0, r#""c""#.into())]);
    }

    #[test]
    fn splits_the_same_however_the_response_is_chunked() {
        let bytes = RESPONSE.as_bytes();
        let whole = split(&[bytes]);
        for at in 0..=bytes.len() {
            assert_eq!(split(&[&bytes[..at], &bytes[at..]]), whole, "split at {at}");
        }
        let singles: Vec<&[u8]> = bytes.chunks(1).collect();
        assert_eq!(split(&singles), whole);
        for size in [2, 3, 7, 13] {
            let chunks: Vec<&[u8]> = bytes.chunks(size).collect();
            assert_eq!(split(&chunks), whole, "chunks of {size}");
        }
    }

    #[test]
    fn keeps_documents_within_the_limit_byte_for_byte() {
        let text = r#"{ "ms" : 1 , "result" : [ { "_id" : "a" , "v" : [ 1 , 2 ] } , { "_id":"b","name":"x y" } ] }"#;
        let docs = split(&[text.as_bytes()]);
        assert_eq!(docs[0].json.as_deref(), Some(br#"{ "_id" : "a" , "v" : [ 1 , 2 ] }"#.as_slice()));
        assert_eq!(fields(&docs[0]), [(0, r#""a""#.into())]);
        assert_eq!(docs[1].json.as_deref(), Some(br#"{ "_id":"b","name":"x y" }"#.as_slice()));
        assert_eq!(fields(&docs[1]), [(0, r#""b""#.into()), (2, r#""x y""#.into())]);
    }

    #[test]
    fn leaves_out_fields_over_their_limit() {
        let title = "x".repeat(FIELD_LIMIT + 1);
        let text = format!(r#"{{"result":[{{"_id":"a","title":"{title}","name":"n"}}]}}"#);
        let docs = split(&[text.as_bytes()]);
        assert_eq!(docs[0].json, None);
        assert_eq!(fields(&docs[0]), [(0, r#""a""#.into()), (2, r#""n""#.into())]);
    }

    #[test]
    fn matches_serde_json_on_generated_documents() {
        use serde_json::{Map, Value, json};
        let mut seed = 0x2545_f491_4f6c_dd1d_u64;
        let mut next = move |bound: u64| {
            seed ^= seed << 13;
            seed ^= seed >> 7;
            seed ^= seed << 17;
            seed % bound
        };
        const CHARS: &[&str] =
            &["a", "Z", "\"", "\\", "]", "}", "{", "[", ",", ":", " ", "\n", "é", "☃", "😀", "\u{1}"];
        const KEYS: &[&str] = &["_id", "_type", "title", "name", "body", "x", "_id2", ""];
        fn value(next: &mut dyn FnMut(u64) -> u64, depth: u32) -> Value {
            let kind = if depth > 3 { next(4) } else { next(7) };
            match kind {
                0 => Value::Null,
                1 => json!(next(2) == 0),
                2 => json!(next(100_000) as f64 / 7.0 - 5000.0),
                3 => Value::String((0..next(12)).map(|_| CHARS[next(CHARS.len() as u64) as usize]).collect()),
                4 | 5 => Value::Object(
                    (0..next(5))
                        .map(|_| (KEYS[next(KEYS.len() as u64) as usize].to_owned(), value(next, depth + 1)))
                        .collect::<Map<_, _>>(),
                ),
                _ => Value::Array((0..next(4)).map(|_| value(next, depth + 1)).collect()),
            }
        }
        let fields = ["_id", "_type", "title", "name"];
        let (mut whole, mut cut, mut captured) = (0, 0, 0);
        for round in 0..200 {
            let docs: Vec<Value> = (0..next(6))
                .map(|_| {
                    let mut doc = match value(&mut next, 1) {
                        Value::Object(map) => map,
                        _ => Map::new(),
                    };
                    doc.insert("_id".into(), json!(format!("d{round}")));
                    Value::Object(doc)
                })
                .collect();
            let response = serde_json::to_vec(&json!({"query": "*[\"result\"]", "result": docs, "ms": 1})).unwrap();
            let limit = next(120) as usize;
            let mut splitter = Splitter::new(limit, &fields);
            let mut at = 0;
            while at < response.len() {
                let end = (at + 1 + next(40) as usize).min(response.len());
                splitter.push(&response[at..end]);
                at = end;
            }
            splitter.finish().unwrap();
            let splits: Vec<Split> = std::iter::from_fn(|| splitter.pop()).collect();
            assert_eq!(splits.len(), docs.len(), "round {round}");
            for (split, doc) in splits.iter().zip(&docs) {
                let bytes = serde_json::to_vec(doc).unwrap();
                assert_eq!(split.len, bytes.len());
                assert_eq!(split.json, (bytes.len() <= limit).then_some(bytes), "round {round}");
                let expected: Vec<(usize, Vec<u8>)> = doc
                    .as_object()
                    .unwrap()
                    .iter()
                    .filter_map(|(key, value)| {
                        let index = fields.iter().position(|field| field == key)?;
                        Some((index, serde_json::to_vec(value).unwrap()))
                    })
                    .collect();
                assert_eq!(split.fields, expected, "round {round}");
                if split.json.is_some() {
                    whole += 1;
                } else {
                    cut += 1;
                }
                captured += expected.len();
            }
        }
        assert!(whole > 100 && cut > 50 && captured > 500, "{whole} whole, {cut} cut, {captured} fields");
    }

    #[test]
    fn reports_responses_without_a_result_array() {
        let mut not_an_array = splitter();
        not_an_array.push(br#"{"result":null,"ms":1}"#);
        assert_eq!(not_an_array.finish(), Err("The query result is not an array"));
        let mut cut = splitter();
        cut.push(br#"{"result":[{"_id":"a"},{"_id":"#);
        assert_eq!(cut.pop().map(|split| split.len), Some(11));
        assert_eq!(cut.finish(), Err("The query response ended early"));
        let mut empty = splitter();
        empty.push(br#"{"result":[]}"#);
        assert_eq!(empty.finish(), Ok(()));
        assert_eq!(empty.pop(), None);
    }
}
