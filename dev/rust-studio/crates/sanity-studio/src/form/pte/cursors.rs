//! Presence in the editor: the location a selection reports, in the shape the JS studio's
//! Portable Text input reports it (`@portabletext/editor` points, relative to the field, and the
//! focus path with `text` appended in a span), and the cursors of the others, at the focus of
//! their selections like the JS input's `UserPresenceCursor` range decorations.

use leptos::prelude::*;
use sanity_color::Hue;
use sanity_mutator::{Path, Segment};
use serde_json::{Value, json};
use wasm_bindgen::JsCast;
use web_sys::{Element, HtmlElement};

use super::dom;
use super::model::{Block, Child, Doc, Point, Selection, TextBlock};
use crate::presence::Present;

/// The child a point is in and the offset in it: the span, at an inline object's edge.
fn child_at(block: &TextBlock, offset: usize) -> Option<(&Child, usize)> {
    let mut position = 0;
    for child in &block.children {
        let len = child.len();
        if matches!(child, Child::Span(_)) && offset <= position + len {
            return Some((child, offset - position));
        }
        position += len;
    }
    block.children.last().map(|child| (child, 0))
}

/// A point as JSON, and the focus path of a selection ending there, relative to the field.
fn point_json(doc: &Doc, point: Point) -> Option<(Value, Path)> {
    match doc.blocks.get(point.block)? {
        Block::Object(object) => {
            let key = object.get("_key").and_then(Value::as_str)?;
            Some((json!({"path": [{"_key": key}], "offset": 0}), vec![Segment::Key(key.to_owned())]))
        }
        Block::Text(block) => {
            let (child, offset) = child_at(block, point.offset)?;
            let point = json!({"path": [{"_key": block.key}, "children", {"_key": child.key()}], "offset": offset});
            let mut path =
                vec![Segment::Key(block.key.clone()), Segment::attr("children"), Segment::Key(child.key().into())];
            if matches!(child, Child::Span(_)) {
                path.push(Segment::attr("text"));
            }
            Some((point, path))
        }
    }
}

/// The presence location of a selection in the field at `field`: its path and the selection.
pub fn location(field: &Path, doc: &Doc, selection: Selection) -> Option<(Path, Value)> {
    let (anchor, _) = point_json(doc, selection.anchor)?;
    let (focus, relative) = point_json(doc, selection.focus)?;
    let mut path = field.clone();
    path.extend(relative);
    Some((path, json!({"anchor": anchor, "focus": focus, "backward": selection.focus < selection.anchor})))
}

fn key_of(segment: Option<&Value>) -> Option<&str> {
    segment?.get("_key")?.as_str()
}

/// The model point of a presence point, while its block exists.
pub fn point_of(doc: &Doc, value: &Value) -> Option<Point> {
    let path = value.get("path")?.as_array()?;
    let block = doc.index_of(key_of(path.first())?)?;
    let offset = value.get("offset").and_then(Value::as_u64).unwrap_or(0) as usize;
    let Block::Text(text) = &doc.blocks[block] else { return Some(Point { block, offset: 0 }) };
    let child = key_of(path.get(2));
    let mut position = 0;
    for candidate in &text.children {
        if Some(candidate.key()) == child {
            return Some(Point { block, offset: position + offset.min(candidate.len()) });
        }
        position += candidate.len();
    }
    // The span is gone (merged or split by an edit): the start of the block.
    Some(Point { block, offset: 0 })
}

#[derive(Clone, Debug, PartialEq)]
pub struct Cursor {
    session_id: String,
    name: String,
    hue: Hue,
    left: f64,
    top: f64,
    height: f64,
}

/// Where the cursors of `present` are, relative to `layer`, which covers the editable.
pub fn measure(root: &HtmlElement, layer: &Element, doc: &Doc, present: &[Present]) -> Vec<Cursor> {
    let origin = layer.get_bounding_client_rect();
    present
        .iter()
        .filter_map(|present| {
            let focus = present.location.selection.as_ref()?.get("focus")?;
            let point = doc.clamp(point_of(doc, focus)?);
            let rect = match doc.blocks.get(point.block)? {
                Block::Object(_) => root.children().item(point.block as u32)?.get_bounding_client_rect(),
                Block::Text(_) => {
                    let (node, offset) = dom::to_dom(root, doc, point)?;
                    let range = web_sys::window()?.document()?.create_range().ok()?;
                    range.set_start(&node, offset).ok()?;
                    range.collapse_with_to_start(true);
                    let rects = range.get_client_rects()?;
                    match rects.item(0) {
                        Some(rect) => rect,
                        None => node
                            .dyn_ref::<Element>()
                            .map(Element::get_bounding_client_rect)
                            .or_else(|| node.parent_element().map(|parent| parent.get_bounding_client_rect()))?,
                    }
                }
            };
            Some(Cursor {
                session_id: present.session_id.clone(),
                name: present.user.name.clone(),
                hue: present.hue,
                left: rect.left() - origin.left(),
                top: rect.top() - origin.top(),
                height: rect.height().max(16.0),
            })
        })
        .collect()
}

/// The cursors, in a layer over the editable that doesn't take pointer events except on the
/// dots, which show the name on hover.
#[component]
pub fn Cursors(cursors: ReadSignal<Vec<Cursor>>, dark: Signal<bool>) -> impl IntoView {
    move || {
        let dark = dark.get();
        cursors
            .get()
            .into_iter()
            .map(|cursor| {
                let bg = cursor.hue.tint(if dark { "400" } else { "500" }).unwrap_or("#888");
                let fg = cursor.hue.tint(if dark { "900" } else { "50" }).unwrap_or("#fff");
                let style = format!(
                    "left: {}px; top: {}px; height: {}px; --presence-cursor-bg: {bg}; --presence-cursor-fg: {fg};",
                    cursor.left, cursor.top, cursor.height
                );
                let test_id = format!("presence-cursor-{}", cursor.name.split(' ').collect::<Vec<_>>().join("-"));
                view! {
                    <span data-ui="PresenceCursor" data-testid=test_id data-session=cursor.session_id style=style>
                        <span data-dot></span>
                        <span data-name>{cursor.name}</span>
                    </span>
                }
            })
            .collect_view()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn doc(value: Value) -> Doc {
        Doc::parse(Some(&value), |type_name| type_name == "block", "block")
    }

    #[test]
    fn reports_selections_like_the_js_editor() {
        let doc = doc(json!([
            {"_key": "b1", "_type": "block", "children": [
                {"_key": "s1", "_type": "span", "text": "Hello "},
                {"_key": "i1", "_type": "inlineThing"},
                {"_key": "s2", "_type": "span", "text": "world"}
            ], "markDefs": []},
            {"_key": "o1", "_type": "image"}
        ]));
        let field = vec![Segment::attr("body")];
        let selection = Selection { anchor: Point { block: 0, offset: 9 }, focus: Point { block: 0, offset: 2 } };
        let (path, value) = location(&field, &doc, selection).unwrap();
        assert_eq!(sanity_mutator::path::to_string(&path), "body[_key==\"b1\"].children[_key==\"s1\"].text");
        assert_eq!(
            value,
            json!({
                "anchor": {"path": [{"_key": "b1"}, "children", {"_key": "s2"}], "offset": 2},
                "focus": {"path": [{"_key": "b1"}, "children", {"_key": "s1"}], "offset": 2},
                "backward": true
            })
        );
        // Points round-trip, including past the inline object.
        assert_eq!(point_of(&doc, &value["anchor"]), Some(selection.anchor));
        assert_eq!(point_of(&doc, &value["focus"]), Some(selection.focus));

        let (path, value) = location(&field, &doc, Selection::caret(Point { block: 1, offset: 0 })).unwrap();
        assert_eq!(sanity_mutator::path::to_string(&path), "body[_key==\"o1\"]");
        assert_eq!(value["focus"], json!({"path": [{"_key": "o1"}], "offset": 0}));
        assert_eq!(point_of(&doc, &value["focus"]), Some(Point { block: 1, offset: 0 }));
    }

    #[test]
    fn places_points_of_removed_spans_at_the_block_start() {
        let doc =
            doc(json!([{"_key": "b1", "_type": "block", "children": [{"_key": "s9", "_type": "span", "text": "ab"}]}]));
        let point = json!({"path": [{"_key": "b1"}, "children", {"_key": "gone"}], "offset": 4});
        assert_eq!(point_of(&doc, &point), Some(Point { block: 0, offset: 0 }));
        assert_eq!(point_of(&doc, &json!({"path": [{"_key": "nope"}], "offset": 0})), None);
    }
}
