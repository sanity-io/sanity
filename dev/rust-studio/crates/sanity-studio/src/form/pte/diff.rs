//! The patches that turn one Portable Text value into another, block by block and keyed like
//! the JS editor's, so that two people editing different blocks don't overwrite each other.

use std::collections::{HashMap, HashSet};

use sanity_mutator::{InsertPosition, PatchOp, Path, Segment};
use serde_json::Value;

fn key(block: &Value) -> Option<&str> {
    block.get("_key").and_then(Value::as_str)
}

fn item(path: &Path, key: &str) -> Path {
    let mut path = path.clone();
    path.push(Segment::key(key));
    path
}

/// Keys that are all present and unique, in order.
fn keys(blocks: &[Value]) -> Option<Vec<&str>> {
    let keys: Vec<&str> = blocks.iter().map(key).collect::<Option<_>>()?;
    let unique: HashSet<&str> = keys.iter().copied().collect();
    (unique.len() == keys.len()).then_some(keys)
}

pub fn diff(path: &Path, before: Option<&Value>, after: &[Value], empty: bool) -> Vec<PatchOp> {
    if empty {
        return if before.is_some() { vec![PatchOp::unset(path.clone())] } else { Vec::new() };
    }
    let mut ops = Vec::new();
    match before.and_then(Value::as_array).filter(|before| !before.is_empty()) {
        Some(before) if diff_array(path, before, after, &mut ops) => {}
        _ => return vec![PatchOp::set(path.clone(), Value::Array(after.to_vec()))],
    }
    ops
}

/// Patches a keyed array item by item, or returns `false` when its items moved or lack keys,
/// in which case the array has to be set as a whole.
fn diff_array(path: &Path, before: &[Value], after: &[Value], ops: &mut Vec<PatchOp>) -> bool {
    let (Some(old_keys), Some(new_keys)) = (keys(before), keys(after)) else { return false };
    let old: HashMap<&str, &Value> = old_keys.iter().copied().zip(before).collect();
    let kept: HashSet<&str> = new_keys.iter().copied().filter(|key| old.contains_key(key)).collect();
    let old_order: Vec<&str> = old_keys.iter().copied().filter(|key| kept.contains(key)).collect();
    let new_order: Vec<&str> = new_keys.iter().copied().filter(|key| kept.contains(key)).collect();
    if old_order != new_order || kept.is_empty() {
        return false;
    }

    ops.extend(old_keys.iter().filter(|key| !kept.contains(*key)).map(|key| PatchOp::unset(item(path, key))));
    let mut index = 0;
    while index < after.len() {
        if kept.contains(new_keys[index]) {
            index += 1;
            continue;
        }
        let start = index;
        while index < after.len() && !kept.contains(new_keys[index]) {
            index += 1;
        }
        let items = after[start..index].to_vec();
        ops.push(if start == 0 {
            PatchOp::insert(InsertPosition::Before, item(path, new_keys[index]), items)
        } else {
            PatchOp::insert(InsertPosition::After, item(path, new_keys[start - 1]), items)
        });
    }
    for (key, value) in new_keys.iter().zip(after) {
        if let Some(old) = old.get(key) {
            diff_value(&item(path, key), old, value, ops);
        }
    }
    true
}

/// Patches what changed inside a value, down to the text of a span, so that the mutator can
/// merge text two people typed into the same block instead of one overwriting the other.
fn diff_value(path: &Path, before: &Value, after: &Value, ops: &mut Vec<PatchOp>) {
    if before == after {
        return;
    }
    match (before, after) {
        (Value::Object(old), Value::Object(new)) if old.get("_type") == new.get("_type") => {
            for key in old.keys().filter(|key| !new.contains_key(*key)) {
                ops.push(PatchOp::unset(attr(path, key)));
            }
            for (key, value) in new {
                match old.get(key) {
                    Some(old) => diff_value(&attr(path, key), old, value, ops),
                    None => ops.push(PatchOp::set(attr(path, key), value.clone())),
                }
            }
        }
        (Value::Array(old), Value::Array(new)) if !old.is_empty() && diff_array(path, old, new, ops) => {}
        _ => ops.push(PatchOp::set(path.clone(), after.clone())),
    }
}

fn attr(path: &Path, name: &str) -> Path {
    let mut path = path.clone();
    path.push(Segment::attr(name));
    path
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn apply(before: Value, after: Value) -> (Vec<PatchOp>, Value) {
        let path = vec![Segment::attr("body")];
        let after = after.as_array().cloned().unwrap();
        let ops = diff(&path, Some(&before), &after, false);
        let mut doc = json!({"body": before});
        sanity_mutator::patch::apply(&mut doc, &ops);
        assert_eq!(doc["body"], Value::Array(after));
        (ops, doc)
    }

    #[test]
    fn patches_changed_inserted_and_removed_blocks_by_key() {
        let (ops, _) = apply(
            json!([{"_key": "a", "t": 1}, {"_key": "b", "t": 2}, {"_key": "c", "t": 3}]),
            json!([{"_key": "x"}, {"_key": "a", "t": 1}, {"_key": "c", "t": 4}, {"_key": "y"}, {"_key": "z"}]),
        );
        let ops: Vec<String> =
            ops.iter().map(|op| serde_json::to_string(&sanity_mutator::patch::op_to_json(op)).unwrap()).collect();
        assert_eq!(
            ops,
            [
                r#"{"unset":["body[_key==\"b\"]"]}"#,
                r#"{"insert":{"before":"body[_key==\"a\"]","items":[{"_key":"x"}]}}"#,
                r#"{"insert":{"after":"body[_key==\"c\"]","items":[{"_key":"y"},{"_key":"z"}]}}"#,
                r#"{"set":{"body[_key==\"c\"].t":4}}"#,
            ]
        );
    }

    #[test]
    fn patches_the_text_of_a_changed_span() {
        let block = |text: &str, marks: Value| {
            json!([{"_key": "b", "_type": "block", "style": "normal", "markDefs": [], "children": [
                {"_key": "s1", "_type": "span", "marks": [], "text": "Hello "},
                {"_key": "s2", "_type": "span", "marks": marks, "text": text},
            ]}])
        };
        let (ops, _) = apply(block("world", json!([])), block("wide world", json!([])));
        assert_eq!(
            ops,
            [PatchOp::set(
                sanity_mutator::path::parse("body[_key==\"b\"].children[_key==\"s2\"].text").unwrap(),
                json!("wide world")
            )]
        );
        let (ops, _) = apply(block("world", json!([])), block("world", json!(["strong"])));
        assert_eq!(
            ops,
            [PatchOp::set(
                sanity_mutator::path::parse("body[_key==\"b\"].children[_key==\"s2\"].marks").unwrap(),
                json!(["strong"])
            )]
        );
    }

    #[test]
    fn sets_the_array_when_blocks_moved_or_keys_are_missing() {
        let (ops, _) = apply(json!([{"_key": "a"}, {"_key": "b"}]), json!([{"_key": "b"}, {"_key": "a"}]));
        assert_eq!(ops.len(), 1);
        let (ops, _) = apply(json!([{"t": 1}]), json!([{"_key": "a"}]));
        assert_eq!(ops.len(), 1);
    }

    #[test]
    fn unsets_an_empty_value_and_writes_nothing_without_changes() {
        let path = vec![Segment::attr("body")];
        assert_eq!(diff(&path, Some(&json!([{"_key": "a"}])), &[], true), [PatchOp::unset(path.clone())]);
        assert!(diff(&path, None, &[], true).is_empty());
        assert!(diff(&path, Some(&json!([{"_key": "a"}])), &[json!({"_key": "a"})], false).is_empty());
    }
}
