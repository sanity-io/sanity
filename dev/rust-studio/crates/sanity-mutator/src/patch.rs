//! Patch operations and how they apply to a document, ported from `Patcher` and the patch
//! classes in `@sanity/mutator/src/patch`.

use serde_json::{Map, Number, Value};

use crate::path::{self, Path, Segment};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum InsertPosition {
    Before,
    After,
    Replace,
}

impl InsertPosition {
    pub fn name(self) -> &'static str {
        match self {
            InsertPosition::Before => "before",
            InsertPosition::After => "after",
            InsertPosition::Replace => "replace",
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub enum Operation {
    Set(Value),
    SetIfMissing(Value),
    Unset,
    Inc(f64),
    Insert(InsertPosition, Vec<Value>),
}

#[derive(Clone, Debug, PartialEq)]
pub struct PatchOp {
    pub path: Path,
    pub op: Operation,
}

impl PatchOp {
    pub fn set(path: Path, value: Value) -> PatchOp {
        PatchOp { path, op: Operation::Set(value) }
    }

    pub fn set_if_missing(path: Path, value: Value) -> PatchOp {
        PatchOp { path, op: Operation::SetIfMissing(value) }
    }

    pub fn unset(path: Path) -> PatchOp {
        PatchOp { path, op: Operation::Unset }
    }

    pub fn insert(position: InsertPosition, path: Path, items: Vec<Value>) -> PatchOp {
        PatchOp { path, op: Operation::Insert(position, items) }
    }

    fn creates_missing(&self) -> bool {
        matches!(self.op, Operation::Set(_) | Operation::SetIfMissing(_))
    }
}

/// Applies `ops` in order to `doc` in place.
pub fn apply(doc: &mut Value, ops: &[PatchOp]) {
    for op in ops {
        if let Some((target, parents)) = op.path.split_last() {
            descend(doc, parents, target, op);
        }
    }
}

fn descend(container: &mut Value, parents: &[Segment], target: &Segment, op: &PatchOp) {
    let Some((head, rest)) = parents.split_first() else {
        deliver(container, target, op);
        return;
    };
    match head {
        Segment::Attr(name) => {
            if !container.is_object() && !container.is_array() {
                if !op.creates_missing() {
                    return;
                }
                *container = Value::Object(Map::new());
            }
            let Value::Object(map) = container else { return };
            if !map.contains_key(name) {
                if !op.creates_missing() {
                    return;
                }
                map.insert(name.clone(), Value::Object(Map::new()));
            }
            descend(map.get_mut(name).unwrap(), rest, target, op);
        }
        _ => {
            let Value::Array(items) = container else { return };
            for index in head.indices(items) {
                if let Some(item) = usize::try_from(index).ok().and_then(|i| items.get_mut(i)) {
                    descend(item, rest, target, op);
                }
            }
        }
    }
}

fn deliver(container: &mut Value, target: &Segment, op: &PatchOp) {
    match &op.op {
        Operation::Set(value) => match (target, &mut *container) {
            (Segment::Attr(name), Value::Object(map)) => {
                map.insert(name.clone(), value.clone());
            }
            (Segment::Attr(_), Value::Array(_)) => {}
            (Segment::Attr(name), primitive) => {
                *primitive = Value::Object(Map::from_iter([(name.clone(), value.clone())]));
            }
            (_, Value::Array(items)) => {
                for index in target.indices(items) {
                    // A write at exactly `length` appends; anything further would leave holes
                    match usize::try_from(index) {
                        Ok(i) if i < items.len() => items[i] = value.clone(),
                        Ok(i) if i == items.len() => items.push(value.clone()),
                        _ => {}
                    }
                }
            }
            _ => {}
        },
        Operation::SetIfMissing(value) => match (target, &mut *container) {
            (Segment::Attr(name), Value::Object(map)) => {
                map.entry(name.clone()).or_insert_with(|| value.clone());
            }
            (Segment::Attr(_), Value::Array(_)) => {}
            (Segment::Attr(name), primitive) => {
                *primitive = Value::Object(Map::from_iter([(name.clone(), value.clone())]));
            }
            // Content Lake rejects nulls in arrays, so setIfMissing never applies to indices
            _ => {}
        },
        Operation::Unset => match container {
            Value::Array(items) => {
                let remove = target.indices(items);
                let mut i = 0;
                items.retain(|_| {
                    let keep = !remove.contains(&i);
                    i += 1;
                    keep
                });
            }
            Value::Object(map) => {
                if let Segment::Attr(name) = target {
                    map.shift_remove(name);
                }
            }
            _ => {}
        },
        Operation::Inc(delta) => match (target, container) {
            (Segment::Attr(name), Value::Object(map)) => {
                if let Some(value) = map.get_mut(name) {
                    increment(value, *delta);
                }
            }
            (target, Value::Array(items)) if target.is_index_reference() => {
                for index in target.indices(items) {
                    if let Some(item) = usize::try_from(index).ok().and_then(|i| items.get_mut(i)) {
                        increment(item, *delta);
                    }
                }
            }
            _ => {}
        },
        Operation::Insert(position, new_items) => {
            let Value::Array(items) = container else { return };
            let indices = target.indices(items);
            let range_bound = |pick_start: bool| match target {
                Segment::Range(start, end) => {
                    let len = items.len() as i64;
                    let resolve = |i: i64| if i < 0 { i + len } else { i };
                    Some(if pick_start {
                        resolve(start.unwrap_or(0))
                    } else {
                        resolve(end.filter(|end| *end != 0).unwrap_or(len))
                    })
                }
                _ => None,
            };
            let at = match position {
                InsertPosition::Before => {
                    let first = indices.first().copied().unwrap_or(0);
                    range_bound(true).map_or(first, |start| start.min(first))
                }
                InsertPosition::After => {
                    let last = indices.last().copied().unwrap_or(0);
                    range_bound(false).map_or(last, |end| end.max(last)) + 1
                }
                InsertPosition::Replace => {
                    let first = indices.first().copied();
                    let mut i = 0;
                    items.retain(|_| {
                        let keep = !indices.contains(&i);
                        i += 1;
                        keep
                    });
                    first.unwrap_or(items.len() as i64)
                }
            };
            let at = at.clamp(0, items.len() as i64) as usize;
            items.splice(at..at, new_items.iter().cloned());
        }
    }
}

fn increment(value: &mut Value, delta: f64) {
    let Value::Number(number) = value else { return };
    let next = match (number.as_i64(), delta.fract() == 0.0) {
        (Some(int), true) => Number::from(int + delta as i64),
        _ => match number.as_f64().map(|n| n + delta).and_then(Number::from_f64) {
            Some(next) => next,
            None => return,
        },
    };
    *value = Value::Number(next);
}

/// Reads the value a patch path points at, for callers that need the current value of a field.
pub fn get<'a>(doc: &'a Value, path: &[Segment]) -> Option<&'a Value> {
    path::get(doc, path)
}

/// Parses the patch body of a Content Lake mutation (`{"id", "set", "unset", …}`) into ordered
/// operations, in the order `parsePatch` applies them.
pub fn parse_patch(patch: &Value) -> Result<Vec<PatchOp>, String> {
    let mut ops = Vec::new();
    let paths = |key: &str| -> Result<Vec<(Path, Value)>, String> {
        let Some(object) = patch.get(key) else { return Ok(Vec::new()) };
        let object = object.as_object().ok_or_else(|| format!("{key} must be an object"))?;
        object.iter().map(|(path, value)| Ok((path::parse(path).map_err(|e| e.to_string())?, value.clone()))).collect()
    };
    for (path, value) in paths("setIfMissing")? {
        ops.push(PatchOp::set_if_missing(path, value));
    }
    for (path, value) in paths("set")? {
        ops.push(PatchOp::set(path, value));
    }
    if let Some(unset) = patch.get("unset") {
        for path in unset.as_array().ok_or("unset must be an array")? {
            let path = path.as_str().ok_or("unset paths must be strings")?;
            ops.push(PatchOp::unset(path::parse(path).map_err(|e| e.to_string())?));
        }
    }
    if patch.get("diffMatchPatch").is_some() {
        return Err("diffMatchPatch is not supported".into());
    }
    for (key, sign) in [("inc", 1.0), ("dec", -1.0)] {
        for (path, value) in paths(key)? {
            let delta = value.as_f64().ok_or_else(|| format!("{key} values must be numbers"))?;
            ops.push(PatchOp { path, op: Operation::Inc(sign * delta) });
        }
    }
    if let Some(insert) = patch.get("insert") {
        let (position, path) = [InsertPosition::Before, InsertPosition::After, InsertPosition::Replace]
            .into_iter()
            .find_map(|position| Some((position, insert.get(position.name())?.as_str()?)))
            .ok_or("Invalid insert patch")?;
        let items = insert.get("items").and_then(Value::as_array).cloned().unwrap_or_default();
        ops.push(PatchOp::insert(position, path::parse(path).map_err(|e| e.to_string())?, items));
    }
    Ok(ops)
}

/// Serializes one operation as the body of a Content Lake patch (without the `id`).
pub fn op_to_json(op: &PatchOp) -> Map<String, Value> {
    let path = path::to_string(&op.path);
    let mut body = Map::new();
    match &op.op {
        Operation::Set(value) => {
            body.insert("set".into(), Value::Object(Map::from_iter([(path, value.clone())])));
        }
        Operation::SetIfMissing(value) => {
            body.insert("setIfMissing".into(), Value::Object(Map::from_iter([(path, value.clone())])));
        }
        Operation::Unset => {
            body.insert("unset".into(), Value::Array(vec![Value::String(path)]));
        }
        Operation::Inc(delta) => {
            let number = Number::from_f64(*delta).unwrap_or_else(|| Number::from(0));
            body.insert("inc".into(), Value::Object(Map::from_iter([(path, Value::Number(number))])));
        }
        Operation::Insert(position, items) => {
            body.insert(
                "insert".into(),
                Value::Object(Map::from_iter([
                    (position.name().to_owned(), Value::String(path)),
                    ("items".into(), Value::Array(items.clone())),
                ])),
            );
        }
    }
    body
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::path::parse;

    fn patched(mut doc: Value, patch: Value) -> Value {
        apply(&mut doc, &parse_patch(&patch).unwrap());
        doc
    }

    #[test]
    fn set_creates_missing_segments_and_overwrites_primitives() {
        assert_eq!(
            patched(json!({"_id": "a"}), json!({"set": {"address.street": "California St"}})),
            json!({"_id": "a", "address": {"street": "California St"}})
        );
        assert_eq!(
            patched(json!({"address": "Fiction St"}), json!({"set": {"address.street": "X"}})),
            json!({"address": {"street": "X"}})
        );
    }

    #[test]
    fn set_on_indices_only_appends_contiguously() {
        let doc = json!({"a": [1, 2]});
        assert_eq!(patched(doc.clone(), json!({"set": {"a[2]": 3}})), json!({"a": [1, 2, 3]}));
        assert_eq!(patched(doc.clone(), json!({"set": {"a[5]": 3}})), json!({"a": [1, 2]}));
        assert_eq!(patched(doc, json!({"set": {"a[-1]": 9}})), json!({"a": [1, 9]}));
    }

    #[test]
    fn set_if_missing_runs_before_set() {
        assert_eq!(
            patched(json!({}), json!({"set": {"a": 2}, "setIfMissing": {"a": 1, "b": 1}})),
            json!({"a": 2, "b": 1})
        );
    }

    #[test]
    fn unset_removes_attributes_and_keyed_items() {
        let doc = json!({"a": 1, "list": [{"_key": "x"}, {"_key": "y"}, {"_key": "z"}]});
        assert_eq!(
            patched(doc, json!({"unset": ["a", "list[_key==\"y\"]", "missing.deep"]})),
            json!({"list": [{"_key": "x"}, {"_key": "z"}]})
        );
    }

    #[test]
    fn inc_and_dec_only_touch_numbers() {
        assert_eq!(
            patched(json!({"n": 1, "f": 1.5, "s": "x"}), json!({"inc": {"n": 2, "f": 1, "s": 1}})),
            json!({"n": 3, "f": 2.5, "s": "x"})
        );
        assert_eq!(patched(json!({"n": 1}), json!({"dec": {"n": 3}})), json!({"n": -2}));
    }

    #[test]
    fn insert_before_after_and_replace() {
        let doc = json!({"l": [{"_key": "a"}, {"_key": "b"}]});
        let item = json!({"_key": "n"});
        assert_eq!(
            patched(doc.clone(), json!({"insert": {"after": "l[-1]", "items": [item]}})),
            json!({"l": [{"_key": "a"}, {"_key": "b"}, {"_key": "n"}]})
        );
        assert_eq!(
            patched(doc.clone(), json!({"insert": {"before": "l[_key==\"b\"]", "items": [item]}})),
            json!({"l": [{"_key": "a"}, {"_key": "n"}, {"_key": "b"}]})
        );
        assert_eq!(
            patched(doc.clone(), json!({"insert": {"replace": "l[0]", "items": [item]}})),
            json!({"l": [{"_key": "n"}, {"_key": "b"}]})
        );
        assert_eq!(
            patched(json!({"l": []}), json!({"insert": {"after": "l[-1]", "items": [1, 2]}})),
            json!({"l": [1, 2]})
        );
        // Inserting into a missing array is a no-op; Studio sends setIfMissing first
        assert_eq!(patched(json!({}), json!({"insert": {"after": "l[-1]", "items": [1]}})), json!({}));
    }

    #[test]
    fn deep_keyed_paths() {
        let doc = json!({"body": [{"_key": "b1", "children": [{"_key": "s1", "text": "hi"}]}]});
        assert_eq!(
            patched(doc, json!({"set": {"body[_key==\"b1\"].children[_key==\"s1\"].text": "yo"}})),
            json!({"body": [{"_key": "b1", "children": [{"_key": "s1", "text": "yo"}]}]})
        );
    }

    #[test]
    fn serializes_operations() {
        let op = PatchOp::insert(InsertPosition::After, parse("l[-1]").unwrap(), vec![json!(1)]);
        assert_eq!(Value::Object(op_to_json(&op)), json!({"insert": {"after": "l[-1]", "items": [1]}}));
        let op = PatchOp::unset(parse("a[_key==\"x\"]").unwrap());
        assert_eq!(Value::Object(op_to_json(&op)), json!({"unset": ["a[_key==\"x\"]"]}));
    }
}
