//! An incremental `text/event-stream` parser. It buffers bytes rather than text so a multi-byte
//! character split across two network chunks decodes correctly.

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct SseEvent {
    pub event: String,
    pub data: String,
    pub id: Option<String>,
}

#[derive(Default)]
pub struct SseParser {
    buffer: Vec<u8>,
    event: String,
    data: Vec<String>,
    id: Option<String>,
}

impl SseParser {
    pub fn new() -> Self {
        Self::default()
    }

    /// Feeds a chunk of the response body and returns the events it completed.
    pub fn push(&mut self, chunk: &[u8]) -> Vec<SseEvent> {
        self.buffer.extend_from_slice(chunk);
        let mut events = Vec::new();
        let mut start = 0;
        let mut i = 0;
        while i < self.buffer.len() {
            let byte = self.buffer[i];
            if byte != b'\n' && byte != b'\r' {
                i += 1;
                continue;
            }
            // A `\r` at the end of the chunk may be the first half of `\r\n`
            if byte == b'\r' && i + 1 == self.buffer.len() {
                break;
            }
            let line = String::from_utf8_lossy(&self.buffer[start..i]).into_owned();
            i += if byte == b'\r' && self.buffer.get(i + 1) == Some(&b'\n') { 2 } else { 1 };
            start = i;
            if let Some(event) = self.line(&line) {
                events.push(event);
            }
        }
        self.buffer.drain(..start);
        events
    }

    fn line(&mut self, line: &str) -> Option<SseEvent> {
        if line.is_empty() {
            if self.data.is_empty() {
                self.event.clear();
                return None;
            }
            let event = SseEvent {
                event: if self.event.is_empty() { "message".into() } else { std::mem::take(&mut self.event) },
                data: std::mem::take(&mut self.data).join("\n"),
                id: self.id.clone(),
            };
            return Some(event);
        }
        if line.starts_with(':') {
            return None;
        }
        let (field, value) = match line.split_once(':') {
            Some((field, value)) => (field, value.strip_prefix(' ').unwrap_or(value)),
            None => (line, ""),
        };
        match field {
            "event" => self.event = value.to_owned(),
            "data" => self.data.push(value.to_owned()),
            "id" => self.id = Some(value.to_owned()),
            _ => {}
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_events_across_chunks() {
        let mut parser = SseParser::new();
        let stream = "event: welcome\ndata: {\"listenerName\":\"x\"}\n\n: heartbeat\n\nevent: mutation\r\nid: 1\r\ndata: {\"a\":\r\ndata: \"ø\"}\r\n\r\n";
        let bytes = stream.as_bytes();
        let mut events = Vec::new();
        // Feed one byte at a time to split every line ending and the two-byte `ø`
        for byte in bytes {
            events.extend(parser.push(std::slice::from_ref(byte)));
        }
        assert_eq!(
            events,
            vec![
                SseEvent { event: "welcome".into(), data: "{\"listenerName\":\"x\"}".into(), id: None },
                SseEvent { event: "mutation".into(), data: "{\"a\":\n\"ø\"}".into(), id: Some("1".into()) },
            ]
        );
    }
}
