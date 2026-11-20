//! The editor's DOM: the blocks rendered into the contenteditable element (re-rendering only the
//! blocks that changed, by key), and DOM selections mapped to model points and back.

use std::collections::HashMap;

use sanity_ui::prelude::IconName;
use serde_json::Value;
use wasm_bindgen::JsCast;
use web_sys::{Element, HtmlElement, Node};

use super::model::{Block, Child, Doc, Point, Selection, TextBlock};

/// What an object block or inline object shows.
pub struct ObjectLabel {
    pub type_title: String,
    pub title: Option<String>,
    pub image: Option<String>,
}

pub struct Renderer<'a> {
    pub label: &'a dyn Fn(&Value) -> ObjectLabel,
    pub decorators: &'a [String],
}

/// The list markers of each block: numbered items count up within their level and restart
/// after anything that is not a deeper item of the same list, like `@portabletext/editor` does.
fn markers(doc: &Doc) -> Vec<Option<String>> {
    let mut counters: Vec<(String, u64, u64)> = Vec::new();
    doc.blocks
        .iter()
        .map(|block| {
            let Block::Text(TextBlock { list_item: Some(list), level, .. }) = block else {
                counters.clear();
                return None;
            };
            let level = level.unwrap_or(1).max(1);
            counters.retain(|(_, counter_level, _)| *counter_level <= level);
            match counters.last_mut() {
                Some((counter_list, counter_level, count)) if *counter_level == level && counter_list == list => {
                    *count += 1;
                }
                _ => {
                    counters.retain(|(_, counter_level, _)| *counter_level < level);
                    counters.push((list.clone(), level, 1));
                }
            }
            let count = counters.last().map_or(1, |(_, _, count)| *count);
            Some(match list.as_str() {
                "number" => format!("{count}."),
                _ => ["●", "○", "■"][(level as usize - 1) % 3].to_owned(),
            })
        })
        .collect()
}

fn document() -> web_sys::Document {
    web_sys::window().and_then(|window| window.document()).expect("a document")
}

fn create(tag: &str) -> HtmlElement {
    document().create_element(tag).expect("valid tag").unchecked_into()
}

fn set(element: &Element, name: &str, value: Option<&str>) {
    let _ = match value {
        Some(value) => element.set_attribute(name, value),
        None => element.remove_attribute(name),
    };
}

fn icon_button(action: &str, title: &str, icon: IconName) -> HtmlElement {
    let button = create("button");
    let _ = button.set_attribute("type", "button");
    let _ = button.set_attribute("data-action", action);
    let _ = button.set_attribute("title", title);
    let _ = button.set_attribute("aria-label", title);
    button.set_inner_html(icon.svg());
    button
}

impl Renderer<'_> {
    /// Renders `doc` into `root`, reusing the element of every block whose value and list marker
    /// are unchanged since it was last rendered (`cache` holds that per key). `force` re-renders
    /// a block whatever its value, for one the browser changed itself (composition).
    pub fn render(&self, root: &HtmlElement, doc: &Doc, cache: &mut HashMap<String, String>, force: Option<&str>) {
        let mut existing: HashMap<String, Element> = HashMap::new();
        let children = root.children();
        for index in 0..children.length() {
            if let Some(element) = children.item(index)
                && let Some(key) = element.get_attribute("data-key")
            {
                existing.insert(key, element);
            }
        }
        let mut previous: Option<Node> = None;
        let mut keys = Vec::with_capacity(doc.blocks.len());
        for (block, marker) in doc.blocks.iter().zip(markers(doc)) {
            let key = block.key().to_owned();
            let signature = format!("{}|{}", marker.as_deref().unwrap_or_default(), block.to_json());
            let element = match existing.remove(&key) {
                Some(element) if cache.get(&key) == Some(&signature) && force != Some(key.as_str()) => element,
                Some(element) => {
                    self.fill(&element, block, marker.as_deref());
                    element
                }
                None => {
                    let element: Element = create("div").unchecked_into();
                    self.fill(&element, block, marker.as_deref());
                    element
                }
            };
            cache.insert(key.clone(), signature);
            let expected = match &previous {
                Some(previous) => previous.next_sibling(),
                None => root.first_child(),
            };
            if !expected.as_ref().is_some_and(|expected| expected.is_same_node(Some(element.as_ref()))) {
                let _ = root.insert_before(&element, expected.as_ref());
            }
            previous = Some(element.into());
            keys.push(key);
        }
        if let Some(previous) = previous {
            while let Some(stray) = previous.next_sibling() {
                let _ = root.remove_child(&stray);
            }
        }
        cache.retain(|key, _| keys.contains(key));
    }

    fn fill(&self, element: &Element, block: &Block, marker: Option<&str>) {
        element.set_text_content(None);
        set(element, "data-key", Some(block.key()));
        match block {
            Block::Text(block) => {
                set(element, "data-block", Some("text"));
                set(element, "contenteditable", None);
                set(element, "data-style", Some(&block.style));
                set(element, "data-list", block.list_item.as_deref());
                let level = block.list_item.as_ref().map(|_| block.level.unwrap_or(1).max(1).to_string());
                set(element, "data-level", level.as_deref());
                set(element, "data-marker", marker);
                let annotations: Vec<&str> =
                    block.mark_defs.iter().filter_map(|def| def.get("_key").and_then(Value::as_str)).collect();
                for child in &block.children {
                    element.append_child(&self.child(child, &annotations)).ok();
                }
                if block.text().ends_with('\n') {
                    let br = create("br");
                    let _ = br.set_attribute("data-trailing", "");
                    element.append_child(&br).ok();
                }
            }
            Block::Object(value) => {
                set(element, "data-block", Some("object"));
                set(element, "contenteditable", Some("false"));
                for name in ["data-style", "data-list", "data-level", "data-marker"] {
                    set(element, name, None);
                }
                let label = (self.label)(value);
                let media = create("div");
                let _ = media.set_attribute("data-part", "media");
                match label.image {
                    Some(src) => {
                        let image = create("img");
                        let _ = image.set_attribute("src", &src);
                        let _ = image.set_attribute("alt", "");
                        media.append_child(&image).ok();
                    }
                    None => media.set_inner_html(IconName::BlockElement.svg()),
                }
                let body = create("div");
                let _ = body.set_attribute("data-part", "body");
                let title = create("div");
                let _ = title.set_attribute("data-part", "title");
                title.set_text_content(Some(label.title.as_deref().unwrap_or(&label.type_title)));
                body.append_child(&title).ok();
                if label.title.is_some() {
                    let kind = create("div");
                    let _ = kind.set_attribute("data-part", "type");
                    kind.set_text_content(Some(&label.type_title));
                    body.append_child(&kind).ok();
                }
                for part in [
                    media,
                    body,
                    icon_button("edit", "Edit", IconName::Edit),
                    icon_button("remove", "Remove", IconName::Trash),
                ] {
                    element.append_child(&part).ok();
                }
            }
        }
    }

    fn child(&self, child: &Child, annotations: &[&str]) -> HtmlElement {
        let span = create("span");
        let _ = span.set_attribute("data-child", child.key());
        match child {
            Child::Span(child) => {
                let decorators: Vec<&str> = child
                    .marks
                    .iter()
                    .map(String::as_str)
                    .filter(|mark| self.decorators.iter().any(|decorator| decorator == mark))
                    .collect();
                if !decorators.is_empty() {
                    let _ = span.set_attribute("data-marks", &decorators.join(" "));
                }
                if child.marks.iter().any(|mark| annotations.contains(&mark.as_str())) {
                    let _ = span.set_attribute("data-annotated", "");
                }
                if child.text.is_empty() {
                    let _ = span.set_attribute("data-zero", "");
                    span.set_text_content(Some("\u{FEFF}"));
                } else {
                    span.set_text_content(Some(&child.text));
                }
            }
            Child::Inline(value) => {
                let label = (self.label)(value);
                let _ = span.set_attribute("data-inline", "");
                let _ = span.set_attribute("contenteditable", "false");
                let _ = span.set_attribute("title", &format!("Edit {}", label.type_title));
                span.set_inner_html(IconName::InlineElement.svg());
                let text = create("span");
                text.set_text_content(Some(label.title.as_deref().unwrap_or(&label.type_title)));
                span.append_child(&text).ok();
            }
        }
        span
    }
}

fn element_of(node: &Node) -> Option<Element> {
    match node.dyn_ref::<Element>() {
        Some(element) => Some(element.clone()),
        None => node.parent_element(),
    }
}

/// The direct child of `root` that holds `node`, and its index.
fn block_element(root: &HtmlElement, node: &Node) -> Option<(usize, Element)> {
    let element = element_of(node)?;
    let block = if element.parent_element().is_some_and(|parent| parent.is_same_node(Some(root.as_ref()))) {
        element
    } else {
        element.closest("[data-key][data-block]").ok().flatten()?
    };
    let children = root.children();
    (0..children.length()).find_map(|index| {
        children
            .item(index)
            .filter(|child| child.is_same_node(Some(block.as_ref())))
            .map(|child| (index as usize, child))
    })
}

/// The model point of a DOM position inside `root`.
pub fn to_point(root: &HtmlElement, doc: &Doc, node: &Node, offset: u32) -> Option<Point> {
    if node.is_same_node(Some(root.as_ref())) {
        let index = offset as usize;
        return Some(if index >= doc.blocks.len() {
            doc.end_of(doc.blocks.len().saturating_sub(1))
        } else {
            Point { block: index, offset: 0 }
        });
    }
    if !root.contains(Some(node)) {
        return None;
    }
    let (index, element) = block_element(root, node)?;
    let Some(Block::Text(block)) = doc.blocks.get(index) else { return Some(Point { block: index, offset: 0 }) };
    let starts: Vec<usize> = block
        .children
        .iter()
        .scan(0, |position, child| {
            let start = *position;
            *position += child.len();
            Some(start)
        })
        .collect();
    let child_element = element_of(node).and_then(|element| element.closest("[data-child]").ok().flatten());
    let point = |offset: usize| Some(Point { block: index, offset: offset.min(block.len()) });
    match child_element.filter(|child| element.contains(Some(child))) {
        Some(child_element) => {
            let key = child_element.get_attribute("data-child").unwrap_or_default();
            let child_index = block.children.iter().position(|child| child.key() == key)?;
            let start = starts[child_index];
            match &block.children[child_index] {
                Child::Inline(_) => point(start + usize::from(offset > 0)),
                Child::Span(span) if child_element.has_attribute("data-zero") => point(start.min(start + span.len())),
                Child::Span(span) => {
                    let inner = if node.node_type() == Node::TEXT_NODE {
                        offset as usize
                    } else if offset == 0 {
                        0
                    } else {
                        span.len()
                    };
                    point(start + inner.min(span.len()))
                }
            }
        }
        None => {
            let nodes = element.child_nodes();
            let mut position = 0;
            for child in 0..(offset.min(nodes.length())) {
                let Some(key) = nodes
                    .item(child)
                    .and_then(|node| node.dyn_into::<Element>().ok())
                    .and_then(|element| element.get_attribute("data-child"))
                else {
                    continue;
                };
                if let Some(child) = block.children.iter().find(|child| child.key() == key) {
                    position += child.len();
                }
            }
            point(position)
        }
    }
}

/// The DOM position of a model point, for the selection.
pub fn to_dom(root: &HtmlElement, doc: &Doc, point: Point) -> Option<(Node, u32)> {
    let element = root.children().item(point.block as u32)?;
    let Some(Block::Text(block)) = doc.blocks.get(point.block) else {
        return Some((root.clone().into(), point.block as u32));
    };
    let spans = element.query_selector_all("[data-child]").ok()?;
    let mut position = 0;
    for (index, child) in block.children.iter().enumerate() {
        let len = child.len();
        if let Child::Span(_) = child
            && point.offset <= position + len
        {
            let span = spans.item(index as u32)?;
            let text = span.first_child()?;
            let zero = span.dyn_ref::<Element>().is_some_and(|span| span.has_attribute("data-zero"));
            let inner = if zero { 0 } else { point.offset - position };
            return Some((text, inner as u32));
        }
        position += len;
    }
    Some((element.into(), 0))
}

pub fn dom_selection() -> Option<web_sys::Selection> {
    web_sys::window()?.get_selection().ok().flatten()
}

/// The model selection of the document selection, when it is inside `root`.
pub fn read_selection(root: &HtmlElement, doc: &Doc) -> Option<Selection> {
    let selection = dom_selection()?;
    let anchor = to_point(root, doc, &selection.anchor_node()?, selection.anchor_offset())?;
    let focus = to_point(root, doc, &selection.focus_node()?, selection.focus_offset())?;
    Some(Selection { anchor, focus })
}

/// The model selection of a `StaticRange` from `InputEvent.getTargetRanges()`.
pub fn read_range(root: &HtmlElement, doc: &Doc, range: &web_sys::StaticRange) -> Option<Selection> {
    let anchor = to_point(root, doc, &range.start_container(), range.start_offset())?;
    let focus = to_point(root, doc, &range.end_container(), range.end_offset())?;
    Some(Selection { anchor, focus })
}

pub fn write_selection(root: &HtmlElement, doc: &Doc, selection: Selection) {
    let Some(dom) = dom_selection() else { return };
    let anchor = doc.clamp(selection.anchor);
    let focus = doc.clamp(selection.focus);
    if selection.is_collapsed()
        && let Some(Block::Object(_)) = doc.blocks.get(anchor.block)
        && let Some(element) = root.children().item(anchor.block as u32)
    {
        if let Ok(range) = document().create_range()
            && range.select_node(&element).is_ok()
        {
            let _ = dom.remove_all_ranges();
            let _ = dom.add_range(&range);
        }
        return;
    }
    if let (Some((anchor_node, anchor_offset)), Some((focus_node, focus_offset))) =
        (to_dom(root, doc, anchor), to_dom(root, doc, focus))
    {
        let _ = dom.set_base_and_extent(&anchor_node, anchor_offset, &focus_node, focus_offset);
    }
}
