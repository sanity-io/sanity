//! The value the Portable Text editor works on: text blocks of spans and inline objects, and
//! object blocks, with the editing operations of `@portabletext/editor` (typing, deleting,
//! splitting and merging blocks, decorators, annotations, styles, lists, objects). Offsets count
//! UTF-16 code units, the unit of DOM selections, and an inline object counts as one.

use sanity_client::random_key;
use serde_json::{Map, Value, json};

pub fn new_key() -> String {
    random_key(12)
}

pub fn utf16_len(text: &str) -> usize {
    text.encode_utf16().count()
}

/// The byte index of the UTF-16 `offset` in `text`, rounded down to a character boundary.
fn byte_index(text: &str, offset: usize) -> usize {
    let mut units = 0;
    for (index, char) in text.char_indices() {
        if units + char.len_utf16() > offset {
            return index;
        }
        units += char.len_utf16();
    }
    text.len()
}

#[derive(Clone, Debug, PartialEq)]
pub struct Span {
    pub key: String,
    pub text: String,
    pub marks: Vec<String>,
    /// Whether the value has a `marks` array, which documents written by other tools can omit.
    has_marks: bool,
    extra: Map<String, Value>,
}

impl Span {
    pub fn new(text: impl Into<String>, marks: Vec<String>) -> Span {
        Span { key: new_key(), text: text.into(), marks, has_marks: true, extra: Map::new() }
    }

    fn from_json(value: &Value) -> Span {
        let mut extra = value.as_object().cloned().unwrap_or_default();
        let key = extra.remove("_key").and_then(|key| key.as_str().map(str::to_owned)).unwrap_or_else(new_key);
        extra.remove("_type");
        let text = extra.remove("text").and_then(|text| text.as_str().map(str::to_owned)).unwrap_or_default();
        let marks = extra.remove("marks");
        Span {
            key,
            text,
            has_marks: marks.is_some(),
            marks: marks
                .and_then(|marks| marks.as_array().cloned())
                .map(|marks| marks.into_iter().filter_map(|mark| mark.as_str().map(str::to_owned)).collect())
                .unwrap_or_default(),
            extra,
        }
    }

    fn to_json(&self) -> Value {
        let mut value = self.extra.clone();
        value.insert("_key".into(), json!(self.key));
        value.insert("_type".into(), json!("span"));
        value.insert("text".into(), json!(self.text));
        if self.has_marks || !self.marks.is_empty() {
            value.insert("marks".into(), json!(self.marks));
        }
        Value::Object(value)
    }

    pub fn len(&self) -> usize {
        utf16_len(&self.text)
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum Child {
    Span(Span),
    /// An inline object, kept as its JSON value.
    Inline(Value),
}

impl Child {
    pub fn key(&self) -> &str {
        match self {
            Child::Span(span) => &span.key,
            Child::Inline(value) => value.get("_key").and_then(Value::as_str).unwrap_or_default(),
        }
    }

    pub fn len(&self) -> usize {
        match self {
            Child::Span(span) => span.len(),
            Child::Inline(_) => 1,
        }
    }

    fn is_empty_span(&self) -> bool {
        matches!(self, Child::Span(span) if span.text.is_empty())
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct TextBlock {
    pub key: String,
    pub type_name: String,
    pub style: String,
    pub list_item: Option<String>,
    pub level: Option<u64>,
    pub mark_defs: Vec<Value>,
    pub children: Vec<Child>,
    has_style: bool,
    has_mark_defs: bool,
    extra: Map<String, Value>,
}

impl TextBlock {
    pub fn new(type_name: &str, style: &str) -> TextBlock {
        TextBlock {
            key: new_key(),
            type_name: type_name.to_owned(),
            style: style.to_owned(),
            list_item: None,
            level: None,
            mark_defs: Vec::new(),
            children: vec![Child::Span(Span::new("", Vec::new()))],
            has_style: true,
            has_mark_defs: true,
            extra: Map::new(),
        }
    }

    fn from_json(value: &Value) -> TextBlock {
        let mut extra = value.as_object().cloned().unwrap_or_default();
        let text = |extra: &mut Map<String, Value>, key: &str| {
            extra.remove(key).and_then(|value| value.as_str().map(str::to_owned))
        };
        let key = text(&mut extra, "_key").unwrap_or_else(new_key);
        let type_name = text(&mut extra, "_type").unwrap_or_else(|| "block".into());
        let style = extra.remove("style");
        let mark_defs = extra.remove("markDefs");
        let children: Vec<Child> = extra
            .remove("children")
            .and_then(|children| children.as_array().cloned())
            .unwrap_or_default()
            .iter()
            .map(|child| match child.get("_type").and_then(Value::as_str) {
                Some("span") | None => Child::Span(Span::from_json(child)),
                Some(_) => Child::Inline(child.clone()),
            })
            .collect();
        let mut block = TextBlock {
            key,
            type_name,
            has_style: style.is_some(),
            style: style.and_then(|style| style.as_str().map(str::to_owned)).unwrap_or_else(|| "normal".into()),
            list_item: text(&mut extra, "listItem"),
            level: extra.remove("level").and_then(|level| level.as_u64()),
            has_mark_defs: mark_defs.is_some(),
            mark_defs: mark_defs.and_then(|defs| defs.as_array().cloned()).unwrap_or_default(),
            children,
            extra,
        };
        if block.children.is_empty() {
            block.children.push(Child::Span(Span::new("", Vec::new())));
        }
        block
    }

    fn to_json(&self) -> Value {
        let mut value = self.extra.clone();
        value.insert("_key".into(), json!(self.key));
        value.insert("_type".into(), json!(self.type_name));
        if self.has_style || self.style != "normal" {
            value.insert("style".into(), json!(self.style));
        }
        if let Some(list_item) = &self.list_item {
            value.insert("listItem".into(), json!(list_item));
            value.insert("level".into(), json!(self.level.unwrap_or(1)));
        }
        if self.has_mark_defs || !self.mark_defs.is_empty() {
            value.insert("markDefs".into(), Value::Array(self.mark_defs.clone()));
        }
        value.insert(
            "children".into(),
            Value::Array(
                self.children
                    .iter()
                    .map(|child| match child {
                        Child::Span(span) => span.to_json(),
                        Child::Inline(value) => value.clone(),
                    })
                    .collect(),
            ),
        );
        Value::Object(value)
    }

    pub fn len(&self) -> usize {
        self.children.iter().map(Child::len).sum()
    }

    pub fn is_empty(&self) -> bool {
        self.children.iter().all(Child::is_empty_span)
    }

    pub fn text(&self) -> String {
        self.children
            .iter()
            .filter_map(|child| match child {
                Child::Span(span) => Some(span.text.as_str()),
                Child::Inline(_) => None,
            })
            .collect()
    }

    /// Makes `offset` a boundary between children, splitting the span there, and returns the
    /// index of the first child after it.
    fn split_at(&mut self, offset: usize) -> usize {
        let mut position = 0;
        for index in 0..self.children.len() {
            if offset == position {
                return index;
            }
            let len = self.children[index].len();
            if offset < position + len {
                if let Child::Span(span) = &mut self.children[index] {
                    let at = byte_index(&span.text, offset - position);
                    let right = Span { key: new_key(), text: span.text.split_off(at), has_marks: true, ..span.clone() };
                    self.children.insert(index + 1, Child::Span(right));
                }
                return index + 1;
            }
            position += len;
        }
        self.children.len()
    }

    fn remove_range(&mut self, start: usize, end: usize) {
        if start >= end {
            return;
        }
        let from = self.split_at(start);
        let to = self.split_at(end);
        self.children.drain(from..to);
    }

    /// Removes and returns the children after `offset`, with the annotations they use.
    fn take_from(&mut self, offset: usize) -> (Vec<Child>, Vec<Value>) {
        let from = self.split_at(offset);
        let children: Vec<Child> = self.children.drain(from..).collect();
        let defs = self.defs_used_by(&children);
        (children, defs)
    }

    fn defs_used_by(&self, children: &[Child]) -> Vec<Value> {
        self.mark_defs
            .iter()
            .filter(|def| {
                let key = def.get("_key").and_then(Value::as_str).unwrap_or_default();
                children
                    .iter()
                    .any(|child| matches!(child, Child::Span(span) if span.marks.iter().any(|mark| mark == key)))
            })
            .cloned()
            .collect()
    }

    fn append(&mut self, children: Vec<Child>, defs: Vec<Value>) {
        self.children.extend(children);
        for def in defs {
            let key = def.get("_key");
            if !self.mark_defs.iter().any(|existing| existing.get("_key") == key) {
                self.mark_defs.push(def);
            }
        }
    }

    fn insert_text(&mut self, offset: usize, text: &str, marks: &[String]) -> usize {
        let mut position = 0;
        let mut target = None;
        for (index, child) in self.children.iter().enumerate() {
            let len = child.len();
            let touches = if offset == 0 { position == 0 } else { position < offset && offset <= position + len };
            if touches {
                if matches!(child, Child::Span(span) if span.marks == marks) {
                    target = Some((index, offset - position));
                }
                break;
            }
            position += len;
        }
        match target {
            Some((index, inner)) => {
                if let Child::Span(span) = &mut self.children[index] {
                    let at = byte_index(&span.text, inner);
                    span.text.insert_str(at, text);
                }
            }
            None => {
                let index = self.split_at(offset);
                self.children.insert(index, Child::Span(Span::new(text, marks.to_vec())));
            }
        }
        self.normalize();
        offset + utf16_len(text)
    }

    /// The length of the character before (or after) `offset`: 2 for astral characters.
    fn char_len(&self, offset: usize, before: bool) -> usize {
        let mut position = 0;
        for child in &self.children {
            let len = child.len();
            if let Child::Span(span) = child {
                let inner = offset as isize - position as isize;
                if (before && inner > 0 && inner as usize <= len) || (!before && inner >= 0 && (inner as usize) < len) {
                    let at = byte_index(&span.text, if before { inner as usize - 1 } else { inner as usize });
                    return span.text[at..].chars().next().map_or(1, char::len_utf16);
                }
            }
            position += len;
        }
        1
    }

    /// The child the caret at `offset` is in, preferring the one before it.
    fn child_at(&self, offset: usize) -> Option<(&Child, bool)> {
        let mut position = 0;
        for child in &self.children {
            let len = child.len();
            if (offset == 0 && position == 0) || (position < offset && offset <= position + len) {
                return Some((child, offset == position + len));
            }
            position += len;
        }
        None
    }

    /// The spans overlapping `start..end`, or the span at the caret when they are equal.
    fn spans_in(&self, start: usize, end: usize) -> Vec<&Span> {
        if start == end {
            return match self.child_at(start) {
                Some((Child::Span(span), _)) => vec![span],
                _ => Vec::new(),
            };
        }
        let mut position = 0;
        let mut spans = Vec::new();
        for child in &self.children {
            let len = child.len();
            if let Child::Span(span) = child
                && len > 0
                && position < end
                && position + len > start
            {
                spans.push(span);
            }
            position += len;
        }
        spans
    }

    fn update_spans(&mut self, start: usize, end: usize, mut update: impl FnMut(&mut Span)) {
        if start >= end {
            return;
        }
        let from = self.split_at(start);
        let to = self.split_at(end);
        for child in &mut self.children[from..to] {
            if let Child::Span(span) = child {
                update(span);
            }
        }
        self.normalize();
    }

    /// `@portabletext/editor`'s normalization: adjacent spans with the same marks merge, empty
    /// spans go unless they are all there is or keep a caret position next to an inline object,
    /// and annotations no span uses are dropped.
    pub fn normalize(&mut self) {
        let mut merged: Vec<Child> = Vec::with_capacity(self.children.len());
        for child in self.children.drain(..) {
            if let (Some(Child::Span(previous)), Child::Span(span)) = (merged.last_mut(), &child)
                && previous.marks == span.marks
            {
                previous.text.push_str(&span.text);
                continue;
            }
            merged.push(child);
        }
        let is_span = |child: Option<&Child>| matches!(child, Some(Child::Span(_)));
        let mut kept: Vec<Child> = Vec::with_capacity(merged.len());
        for index in 0..merged.len() {
            let removable = merged[index].is_empty_span()
                && (is_span(index.checked_sub(1).and_then(|i| merged.get(i))) || is_span(merged.get(index + 1)));
            if !removable {
                kept.push(merged[index].clone());
            }
        }
        let mut children: Vec<Child> = Vec::with_capacity(kept.len() + 2);
        for child in kept {
            if matches!(child, Child::Inline(_)) && !is_span(children.last()) {
                children.push(Child::Span(Span::new("", Vec::new())));
            }
            children.push(child);
        }
        if !is_span(children.last()) {
            children.push(Child::Span(Span::new("", Vec::new())));
        }
        self.children = children;
        let used: Vec<String> = self.defs_used_by(&self.children).iter().filter_map(def_key).collect();
        self.mark_defs.retain(|def| def_key(def).is_some_and(|key| used.contains(&key)));
    }
}

fn def_key(def: &Value) -> Option<String> {
    def.get("_key").and_then(Value::as_str).map(str::to_owned)
}

#[derive(Clone, Debug, PartialEq)]
pub enum Block {
    Text(TextBlock),
    /// An object block, kept as its JSON value.
    Object(Value),
}

impl Block {
    pub fn key(&self) -> &str {
        match self {
            Block::Text(block) => &block.key,
            Block::Object(value) => value.get("_key").and_then(Value::as_str).unwrap_or_default(),
        }
    }

    pub fn to_json(&self) -> Value {
        match self {
            Block::Text(block) => block.to_json(),
            Block::Object(value) => value.clone(),
        }
    }

    fn len(&self) -> usize {
        match self {
            Block::Text(block) => block.len(),
            Block::Object(_) => 0,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Point {
    pub block: usize,
    pub offset: usize,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Selection {
    pub anchor: Point,
    pub focus: Point,
}

impl Selection {
    pub fn caret(point: Point) -> Selection {
        Selection { anchor: point, focus: point }
    }

    pub fn is_collapsed(&self) -> bool {
        self.anchor == self.focus
    }

    pub fn start(&self) -> Point {
        self.anchor.min(self.focus)
    }

    pub fn end(&self) -> Point {
        self.anchor.max(self.focus)
    }
}

const HEADING_STYLES: [&str; 7] = ["h1", "h2", "h3", "h4", "h5", "h6", "blockquote"];

#[derive(Clone, Debug, PartialEq)]
pub struct Doc {
    pub blocks: Vec<Block>,
    /// The `_type` of new text blocks.
    pub text_type: String,
}

impl Doc {
    pub fn parse(value: Option<&Value>, is_text_type: impl Fn(&str) -> bool, text_type: &str) -> Doc {
        let blocks: Vec<Block> = value
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .map(|item| {
                        let type_name = item.get("_type").and_then(Value::as_str).unwrap_or("block");
                        if is_text_type(type_name) {
                            Block::Text(TextBlock::from_json(item))
                        } else {
                            Block::Object(item.clone())
                        }
                    })
                    .collect()
            })
            .unwrap_or_default();
        let mut doc = Doc { blocks, text_type: text_type.to_owned() };
        doc.ensure_block();
        doc
    }

    pub fn to_json(&self) -> Vec<Value> {
        self.blocks.iter().map(Block::to_json).collect()
    }

    /// One empty text block without a list, which the editor writes as no value.
    pub fn is_empty(&self) -> bool {
        matches!(self.blocks.as_slice(), [Block::Text(block)] if block.is_empty() && block.list_item.is_none())
    }

    fn ensure_block(&mut self) {
        if self.blocks.is_empty() {
            self.blocks.push(Block::Text(TextBlock::new(&self.text_type, "normal")));
        }
    }

    pub fn index_of(&self, key: &str) -> Option<usize> {
        self.blocks.iter().position(|block| block.key() == key)
    }

    /// A selection of one object block, which is what selecting its element gives, as a caret
    /// on it: typing then goes into a new block after it instead of replacing it.
    pub fn object_selection(&self, selection: Selection) -> Selection {
        let (start, end) = (selection.start(), selection.end());
        let on_object = start.offset == 0 && matches!(self.blocks.get(start.block), Some(Block::Object(_)));
        if on_object && (end == start || (end.block == start.block + 1 && end.offset == 0)) {
            Selection::caret(start)
        } else {
            selection
        }
    }

    pub fn clamp(&self, point: Point) -> Point {
        let block = point.block.min(self.blocks.len().saturating_sub(1));
        Point { block, offset: point.offset.min(self.blocks.get(block).map_or(0, Block::len)) }
    }

    pub fn end_of(&self, block: usize) -> Point {
        Point { block, offset: self.blocks.get(block).map_or(0, Block::len) }
    }

    fn text_mut(&mut self, index: usize) -> Option<&mut TextBlock> {
        match self.blocks.get_mut(index) {
            Some(Block::Text(block)) => Some(block),
            _ => None,
        }
    }

    fn text(&self, index: usize) -> Option<&TextBlock> {
        match self.blocks.get(index) {
            Some(Block::Text(block)) => Some(block),
            _ => None,
        }
    }

    /// A text block to put the caret in at `point`: an object block gets one after it.
    fn ensure_text_at(&mut self, point: Point) -> Point {
        if self.text(point.block).is_some() {
            return point;
        }
        let block = TextBlock::new(&self.text_type, "normal");
        self.blocks.insert(point.block + 1, Block::Text(block));
        Point { block: point.block + 1, offset: 0 }
    }

    /// The `start..end` offsets of the selection in each text block it covers.
    fn text_ranges(&self, selection: Selection) -> Vec<(usize, usize, usize)> {
        let (start, end) = (selection.start(), selection.end());
        (start.block..=end.block.min(self.blocks.len().saturating_sub(1)))
            .filter_map(|index| {
                let block = self.text(index)?;
                let from = if index == start.block { start.offset } else { 0 };
                let to = if index == end.block { end.offset } else { block.len() };
                Some((index, from.min(block.len()), to.min(block.len())))
            })
            .collect()
    }

    pub fn delete(&mut self, selection: Selection) -> Point {
        let (start, end) = (self.clamp(selection.start()), self.clamp(selection.end()));
        if start == end {
            return start;
        }
        if start.block == end.block {
            if let Some(block) = self.text_mut(start.block) {
                block.remove_range(start.offset, end.offset);
                block.normalize();
            }
            return start;
        }
        let tail = self.text_mut(end.block).map(|block| block.take_from(end.offset));
        let point = if let Some(block) = self.text_mut(start.block) {
            block.remove_range(start.offset, block.len());
            if let Some((children, defs)) = tail {
                block.append(children, defs);
            }
            block.normalize();
            self.blocks.drain(start.block + 1..=end.block);
            start
        } else if let Some((children, defs)) = tail {
            let block = self.text_mut(end.block).expect("the end block is a text block");
            block.children.clear();
            block.mark_defs.clear();
            block.append(children, defs);
            block.normalize();
            self.blocks.drain(start.block..end.block);
            Point { block: start.block, offset: 0 }
        } else {
            self.blocks.drain(start.block..=end.block);
            self.blocks.insert(start.block, Block::Text(TextBlock::new(&self.text_type, "normal")));
            Point { block: start.block, offset: 0 }
        };
        self.ensure_block();
        point
    }

    pub fn insert_text(&mut self, selection: Selection, text: &str, marks: &[String]) -> Point {
        let point = self.delete(selection);
        let point = self.ensure_text_at(point);
        let block = self.text_mut(point.block).expect("ensure_text_at returns a text block");
        Point { block: point.block, offset: block.insert_text(point.offset, text, marks) }
    }

    /// Pasted plain text: one block per line.
    pub fn insert_plain(&mut self, selection: Selection, text: &str, marks: &[String]) -> Point {
        let text = text.replace("\r\n", "\n");
        let mut point = self.delete(selection);
        for (index, line) in text.split('\n').enumerate() {
            if index > 0 {
                point = self.split(Selection::caret(point));
            }
            if !line.is_empty() {
                point = self.insert_text(Selection::caret(point), line, marks);
            }
        }
        point
    }

    /// Enter: splits the block, or ends the list when the list item is empty.
    pub fn split(&mut self, selection: Selection) -> Point {
        let point = self.delete(selection);
        let point = self.ensure_text_at(point);
        let text_type = self.text_type.clone();
        let block = self.text_mut(point.block).expect("ensure_text_at returns a text block");
        if block.is_empty() && block.list_item.is_some() {
            block.list_item = None;
            block.level = None;
            return point;
        }
        let at_end = point.offset >= block.len();
        let style = if at_end && HEADING_STYLES.contains(&block.style.as_str()) {
            "normal".to_owned()
        } else {
            block.style.clone()
        };
        let mut next =
            TextBlock { list_item: block.list_item.clone(), level: block.level, ..TextBlock::new(&text_type, &style) };
        if point.offset == 0 && !block.is_empty() {
            next.style = block.style.clone();
            self.blocks.insert(point.block, Block::Text(next));
            return Point { block: point.block + 1, offset: 0 };
        }
        let (children, defs) = block.take_from(point.offset);
        block.normalize();
        next.children.clear();
        next.append(children, defs);
        next.normalize();
        self.blocks.insert(point.block + 1, Block::Text(next));
        Point { block: point.block + 1, offset: 0 }
    }

    /// Removes the object block at `index`, leaving the caret where it was.
    fn remove_object(&mut self, index: usize, backward: bool) -> Point {
        self.blocks.remove(index);
        self.ensure_block();
        if backward && index > 0 { self.end_of(index - 1) } else { self.clamp(Point { block: index, offset: 0 }) }
    }

    /// Backspace with a collapsed selection.
    pub fn delete_backward(&mut self, point: Point) -> Point {
        let point = self.clamp(point);
        if self.text(point.block).is_none() {
            return self.remove_object(point.block, true);
        }
        if point.offset > 0 {
            let len = self.text(point.block).map_or(1, |block| block.char_len(point.offset, true));
            let start = Point { block: point.block, offset: point.offset.saturating_sub(len) };
            return self.delete(Selection { anchor: start, focus: point });
        }
        if let Some(block) = self.text_mut(point.block)
            && block.list_item.is_some()
        {
            block.list_item = None;
            block.level = None;
            return point;
        }
        if point.block == 0 {
            return point;
        }
        let previous = point.block - 1;
        if self.text(previous).is_none() {
            self.blocks.remove(previous);
            return Point { block: previous, offset: 0 };
        }
        self.merge_into_previous(point.block)
    }

    /// Delete with a collapsed selection.
    pub fn delete_forward(&mut self, point: Point) -> Point {
        let point = self.clamp(point);
        if self.text(point.block).is_none() {
            return self.remove_object(point.block, false);
        }
        let len = self.blocks.get(point.block).map_or(0, Block::len);
        if point.offset < len {
            let size = self.text(point.block).map_or(1, |block| block.char_len(point.offset, false));
            let end = Point { block: point.block, offset: point.offset + size };
            return self.delete(Selection { anchor: point, focus: end });
        }
        let next = point.block + 1;
        if next >= self.blocks.len() {
            return point;
        }
        if self.text(next).is_none() {
            self.blocks.remove(next);
            return point;
        }
        self.merge_into_previous(next)
    }

    fn merge_into_previous(&mut self, index: usize) -> Point {
        let Block::Text(mut block) = self.blocks.remove(index) else { unreachable!("merged blocks are text blocks") };
        let previous = self.text_mut(index - 1).expect("the previous block is a text block");
        let offset = previous.len();
        let children = std::mem::take(&mut block.children);
        let defs = block.defs_used_by(&children);
        previous.append(children, defs);
        previous.normalize();
        Point { block: index - 1, offset }
    }

    /// The marks typing at `point` continues: those of the span before the caret, without the
    /// annotations it ends.
    pub fn marks_at(&self, point: Point) -> Vec<String> {
        let Some(block) = self.text(point.block) else { return Vec::new() };
        match block.child_at(point.offset) {
            Some((Child::Span(span), at_end)) => span
                .marks
                .iter()
                .filter(|mark| {
                    !at_end
                        || point.offset == 0
                        || !block.mark_defs.iter().any(|def| def_key(def).as_deref() == Some(mark))
                })
                .cloned()
                .collect(),
            _ => Vec::new(),
        }
    }

    pub fn has_mark(&self, selection: Selection, mark: &str) -> bool {
        if selection.is_collapsed() {
            return self.marks_at(selection.anchor).iter().any(|existing| existing == mark);
        }
        let spans: Vec<&Span> = self
            .text_ranges(selection)
            .into_iter()
            .flat_map(|(index, from, to)| self.text(index).map(|block| block.spans_in(from, to)).unwrap_or_default())
            .collect();
        !spans.is_empty() && spans.iter().all(|span| span.marks.iter().any(|existing| existing == mark))
    }

    pub fn toggle_decorator(&mut self, selection: Selection, decorator: &str) {
        let add = !self.has_mark(selection, decorator);
        for (index, from, to) in self.text_ranges(selection) {
            if let Some(block) = self.text_mut(index) {
                block.update_spans(from, to, |span| {
                    span.marks.retain(|mark| mark != decorator);
                    if add {
                        span.marks.push(decorator.to_owned());
                    }
                });
            }
        }
    }

    /// Annotates the selected text with a new `type_name` object, and returns the block it
    /// starts in and the key of the annotation, for editing it.
    pub fn add_annotation(&mut self, selection: Selection, type_name: &str) -> Option<(String, String)> {
        if selection.is_collapsed() {
            return None;
        }
        let key = new_key();
        let mut first = None;
        for (index, from, to) in self.text_ranges(selection) {
            if from == to {
                continue;
            }
            let Some(block) = self.text_mut(index) else { continue };
            block.mark_defs.push(json!({"_key": key, "_type": type_name}));
            block.update_spans(from, to, |span| span.marks.push(key.clone()));
            first.get_or_insert_with(|| block.key.clone());
        }
        first.map(|block| (block, key))
    }

    pub fn remove_annotation(&mut self, block_key: &str, key: &str) {
        let Some(index) = self.index_of(block_key) else { return };
        if let Some(block) = self.text_mut(index) {
            for child in &mut block.children {
                if let Child::Span(span) = child {
                    span.marks.retain(|mark| mark != key);
                }
            }
            block.normalize();
        }
    }

    /// The annotations at the selection: `(block key, annotation)`.
    pub fn annotations_at(&self, selection: Selection) -> Vec<(String, Value)> {
        let point = selection.start();
        let Some(block) = self.text(point.block) else { return Vec::new() };
        let end = if selection.end().block == point.block { selection.end().offset } else { block.len() };
        let mut found: Vec<(String, Value)> = Vec::new();
        for span in block.spans_in(point.offset, end) {
            for mark in &span.marks {
                if let Some(def) = block.mark_defs.iter().find(|def| def_key(def).as_deref() == Some(mark))
                    && !found.iter().any(|(_, existing)| existing == def)
                {
                    found.push((block.key.clone(), def.clone()));
                }
            }
        }
        found
    }

    pub fn style_at(&self, selection: Selection) -> Option<String> {
        self.text(selection.start().block).map(|block| block.style.clone())
    }

    pub fn list_at(&self, selection: Selection) -> Option<String> {
        self.text(selection.start().block).and_then(|block| block.list_item.clone())
    }

    pub fn set_style(&mut self, selection: Selection, style: &str) {
        for (index, _, _) in self.text_ranges(selection) {
            if let Some(block) = self.text_mut(index) {
                block.style = style.to_owned();
                block.has_style = true;
            }
        }
    }

    pub fn toggle_list(&mut self, selection: Selection, list: &str) {
        let ranges = self.text_ranges(selection);
        let all = ranges
            .iter()
            .all(|(index, _, _)| self.text(*index).is_some_and(|block| block.list_item.as_deref() == Some(list)));
        for (index, _, _) in ranges {
            if let Some(block) = self.text_mut(index) {
                if all {
                    block.list_item = None;
                    block.level = None;
                } else {
                    block.list_item = Some(list.to_owned());
                    block.level = Some(block.level.unwrap_or(1));
                }
            }
        }
    }

    /// Tab and Shift+Tab: changes the level of the selected list items, if there are any.
    pub fn indent(&mut self, selection: Selection, delta: i64) -> bool {
        let mut changed = false;
        for (index, _, _) in self.text_ranges(selection) {
            if let Some(block) = self.text_mut(index)
                && block.list_item.is_some()
            {
                block.level = Some((block.level.unwrap_or(1) as i64 + delta).clamp(1, 10) as u64);
                changed = true;
            }
        }
        changed
    }

    /// Inserts an object block after the block at the selection (in place of it when it is an
    /// empty text block), with a text block after it to keep typing in.
    pub fn insert_block(&mut self, selection: Selection, value: Value) -> Point {
        let point = self.delete(selection);
        let index = match self.text(point.block) {
            Some(block) if block.is_empty() => {
                self.blocks[point.block] = Block::Object(value);
                point.block
            }
            _ => {
                self.blocks.insert(point.block + 1, Block::Object(value));
                point.block + 1
            }
        };
        if index + 1 >= self.blocks.len() {
            self.blocks.push(Block::Text(TextBlock::new(&self.text_type, "normal")));
        }
        Point { block: index + 1, offset: 0 }
    }

    pub fn insert_inline(&mut self, selection: Selection, value: Value) -> Point {
        let point = self.delete(selection);
        let point = self.ensure_text_at(point);
        let block = self.text_mut(point.block).expect("ensure_text_at returns a text block");
        let index = block.split_at(point.offset);
        block.children.insert(index, Child::Inline(value));
        block.normalize();
        Point { block: point.block, offset: point.offset + 1 }
    }

    pub fn remove_block(&mut self, key: &str) -> Option<Point> {
        let index = self.index_of(key)?;
        self.blocks.remove(index);
        self.ensure_block();
        Some(self.clamp(Point { block: index, offset: 0 }))
    }

    pub fn remove_inline(&mut self, block_key: &str, child_key: &str) {
        let Some(index) = self.index_of(block_key) else { return };
        if let Some(block) = self.text_mut(index) {
            block.children.retain(|child| child.key() != child_key);
            block.normalize();
        }
    }

    /// The selected text, with blocks separated by blank lines like the JS editor copies them.
    pub fn plain_text(&self, selection: Selection) -> String {
        self.text_ranges(selection)
            .into_iter()
            .filter_map(|(index, from, to)| {
                let block = self.text(index)?;
                let mut text = String::new();
                let mut position = 0;
                for child in &block.children {
                    let len = child.len();
                    if let Child::Span(span) = child {
                        let (a, b) = (from.max(position), to.min(position + len));
                        if a < b {
                            text.push_str(
                                &span.text[byte_index(&span.text, a - position)..byte_index(&span.text, b - position)],
                            );
                        }
                    }
                    position += len;
                }
                Some(text)
            })
            .collect::<Vec<_>>()
            .join("\n\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn doc(value: Value) -> Doc {
        Doc::parse(Some(&value), |type_name| type_name == "block", "block")
    }

    fn texts(doc: &Doc) -> Vec<String> {
        doc.blocks
            .iter()
            .map(|block| match block {
                Block::Text(block) => block.text(),
                Block::Object(value) => format!("<{}>", value["_type"].as_str().unwrap_or_default()),
            })
            .collect()
    }

    fn at(block: usize, offset: usize) -> Point {
        Point { block, offset }
    }

    fn range(anchor: Point, focus: Point) -> Selection {
        Selection { anchor, focus }
    }

    fn sample() -> Doc {
        doc(json!([
            {"_key": "a", "_type": "block", "style": "normal", "markDefs": [{"_key": "l", "_type": "link", "href": "https://sanity.io"}], "children": [
                {"_key": "a1", "_type": "span", "text": "Hello ", "marks": []},
                {"_key": "a2", "_type": "span", "text": "bold", "marks": ["strong"]},
                {"_key": "a3", "_type": "span", "text": " link", "marks": ["l"]}
            ]},
            {"_key": "img", "_type": "image", "asset": {"_ref": "image-1"}},
            {"_key": "b", "_type": "block", "style": "h1", "markDefs": [], "children": [
                {"_key": "b1", "_type": "span", "text": "Title 😀", "marks": []}
            ]}
        ]))
    }

    #[test]
    fn round_trips_values_unchanged() {
        let value = json!([
            {"_key": "a", "_type": "block", "children": [{"_key": "s", "_type": "span", "text": "No marks"}], "custom": 1},
            {"_key": "b", "_type": "block", "style": "normal", "listItem": "bullet", "level": 2, "markDefs": [], "children": [
                {"_key": "c", "_type": "span", "text": "x", "marks": []},
                {"_key": "d", "_type": "stockTicker", "symbol": "AAPL"},
                {"_key": "e", "_type": "span", "text": "", "marks": []}
            ]},
            {"_key": "o", "_type": "image"}
        ]);
        assert_eq!(Value::Array(doc(value.clone()).to_json()), value);
    }

    #[test]
    fn types_into_the_span_with_the_same_marks() {
        let mut doc = sample();
        let point = doc.insert_text(Selection::caret(at(0, 10)), "er", &["strong".to_owned()]);
        assert_eq!(point, at(0, 12));
        assert_eq!(texts(&doc)[0], "Hello bolder link");
        let Block::Text(block) = &doc.blocks[0] else { panic!() };
        assert_eq!(block.children.len(), 3);
        assert_eq!(block.children[1].key(), "a2");
    }

    #[test]
    fn typing_with_other_marks_starts_a_span() {
        let mut doc = sample();
        doc.insert_text(Selection::caret(at(0, 3)), "X", &["em".to_owned()]);
        let Block::Text(block) = &doc.blocks[0] else { panic!() };
        let spans: Vec<(&str, Vec<String>)> = block
            .children
            .iter()
            .map(|child| match child {
                Child::Span(span) => (span.text.as_str(), span.marks.clone()),
                Child::Inline(_) => ("", Vec::new()),
            })
            .collect();
        assert_eq!(spans[0], ("Hel", vec![]));
        assert_eq!(spans[1], ("X", vec!["em".to_owned()]));
        assert_eq!(spans[2], ("lo ", vec![]));
        assert_eq!(block.children[0].key(), "a1");
    }

    #[test]
    fn deletes_across_blocks_and_objects() {
        let mut doc = sample();
        let point = doc.delete(range(at(0, 8), at(2, 2)));
        assert_eq!(point, at(0, 8));
        assert_eq!(texts(&doc), ["Hello botle 😀"]);
        let Block::Text(block) = &doc.blocks[0] else { panic!() };
        assert!(block.mark_defs.is_empty(), "the link went with the deleted text");
    }

    #[test]
    fn backspace_deletes_whole_astral_characters() {
        let mut doc = sample();
        let end = doc.end_of(2);
        assert_eq!(end.offset, 8);
        let point = doc.delete_backward(end);
        assert_eq!(point, at(2, 6));
        assert_eq!(texts(&doc)[2], "Title ");
    }

    #[test]
    fn backspace_at_block_start_removes_the_object_before_then_merges() {
        let mut doc = sample();
        let point = doc.delete_backward(at(2, 0));
        assert_eq!(point, at(1, 0));
        assert_eq!(texts(&doc), ["Hello bold link", "Title 😀"]);
        let point = doc.delete_backward(point);
        assert_eq!(point, at(0, 15));
        assert_eq!(texts(&doc), ["Hello bold linkTitle 😀"]);
        let Block::Text(block) = &doc.blocks[0] else { panic!() };
        assert_eq!(block.key, "a");
    }

    #[test]
    fn enter_splits_and_ends_headings_and_lists() {
        let mut doc = sample();
        let point = doc.split(Selection::caret(at(0, 8)));
        assert_eq!(point, at(1, 0));
        assert_eq!(texts(&doc)[..2], ["Hello bo", "ld link"]);
        let Block::Text(second) = &doc.blocks[1] else { panic!() };
        assert_eq!(second.mark_defs.len(), 1, "the link moved along with its text");
        let Block::Text(first) = &doc.blocks[0] else { panic!() };
        assert!(first.mark_defs.is_empty());

        let end = doc.end_of(3);
        let point = doc.split(Selection::caret(end));
        let Block::Text(after_heading) = &doc.blocks[point.block] else { panic!() };
        assert_eq!(after_heading.style, "normal");

        doc.toggle_list(Selection::caret(point), "bullet");
        let point = doc.split(Selection::caret(point));
        let Block::Text(item) = &doc.blocks[point.block] else { panic!() };
        assert_eq!(item.list_item, None, "Enter in an empty list item ends the list");
    }

    #[test]
    fn enter_at_the_start_keeps_the_block_key() {
        let mut doc = sample();
        let point = doc.split(Selection::caret(at(2, 0)));
        assert_eq!(point, at(3, 0));
        assert_eq!(doc.blocks[3].key(), "b");
        assert_eq!(texts(&doc)[2], "");
    }

    #[test]
    fn toggles_decorators_over_ranges() {
        let mut doc = sample();
        let selection = range(at(0, 0), at(0, 10));
        assert!(!doc.has_mark(selection, "strong"));
        doc.toggle_decorator(selection, "strong");
        assert!(doc.has_mark(selection, "strong"));
        let Block::Text(block) = &doc.blocks[0] else { panic!() };
        assert_eq!(block.children.len(), 2, "the bold spans merged");
        doc.toggle_decorator(range(at(0, 2), at(0, 4)), "strong");
        assert!(!doc.has_mark(range(at(0, 2), at(0, 4)), "strong"));
        assert!(doc.has_mark(range(at(0, 0), at(0, 2)), "strong"));
    }

    #[test]
    fn adds_and_removes_annotations() {
        let mut doc = sample();
        let (block, key) = doc.add_annotation(range(at(0, 0), at(0, 5)), "link").unwrap();
        assert_eq!(block, "a");
        let annotations = doc.annotations_at(Selection::caret(at(0, 2)));
        assert_eq!(annotations.len(), 1);
        assert_eq!(annotations[0].1["_key"], json!(key));
        assert_eq!(doc.marks_at(at(0, 5)), Vec::<String>::new(), "typing after a link does not extend it");
        doc.remove_annotation("a", &key);
        assert!(doc.annotations_at(Selection::caret(at(0, 2))).is_empty());
        let Block::Text(block) = &doc.blocks[0] else { panic!() };
        assert_eq!(block.mark_defs.len(), 1);
    }

    #[test]
    fn inserts_inline_and_block_objects() {
        let mut doc = sample();
        let point = doc.insert_inline(Selection::caret(at(2, 5)), json!({"_key": "i", "_type": "stockTicker"}));
        assert_eq!(point, at(2, 6));
        let Block::Text(block) = &doc.blocks[2] else { panic!() };
        assert!(matches!(block.children[1], Child::Inline(_)));
        let point = doc.insert_block(Selection::caret(at(0, 3)), json!({"_key": "o", "_type": "image"}));
        assert_eq!(texts(&doc)[1], "<image>");
        assert_eq!(point, at(2, 0));

        let mut empty = Doc::parse(None, |type_name| type_name == "block", "block");
        let point = empty.insert_block(Selection::caret(at(0, 0)), json!({"_key": "o", "_type": "image"}));
        assert_eq!(texts(&empty), ["<image>", ""]);
        assert_eq!(point, at(1, 0));
    }

    #[test]
    fn pastes_lines_as_blocks_and_copies_blocks_as_paragraphs() {
        let mut doc = sample();
        let point = doc.insert_plain(Selection::caret(at(2, 0)), "one\r\ntwo\n", &[]);
        assert_eq!(texts(&doc)[2..], ["one", "two", "Title 😀"]);
        assert_eq!(point, at(4, 0));
        assert_eq!(doc.plain_text(range(at(2, 1), at(3, 2))), "ne\n\ntw");
    }

    #[test]
    fn lists_toggle_and_indent() {
        let mut doc = sample();
        let selection = range(at(0, 0), at(2, 1));
        doc.toggle_list(selection, "number");
        assert_eq!(doc.list_at(selection).as_deref(), Some("number"));
        assert!(doc.indent(selection, 1));
        let Block::Text(block) = &doc.blocks[2] else { panic!() };
        assert_eq!(block.level, Some(2));
        doc.toggle_list(selection, "number");
        assert_eq!(doc.list_at(selection), None);
    }

    #[test]
    fn an_empty_document_is_one_empty_block() {
        let mut doc = Doc::parse(None, |type_name| type_name == "block", "block");
        assert!(doc.is_empty());
        doc.insert_text(Selection::caret(at(0, 0)), "a", &[]);
        assert!(!doc.is_empty());
        doc.delete_backward(at(0, 1));
        assert!(doc.is_empty());
    }
}
