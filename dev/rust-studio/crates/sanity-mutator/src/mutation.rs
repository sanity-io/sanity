//! Content Lake mutations: serialization to the `/data/mutate` wire format and local application,
//! ported from `@sanity/mutator/src/document/Mutation.ts`.

use serde_json::{Map, Value};

use crate::patch::{self, PatchOp};

#[derive(Clone, Debug, PartialEq)]
pub enum Mutation {
    Create(Value),
    CreateIfNotExists(Value),
    CreateOrReplace(Value),
    Delete(String),
    Patch { id: String, ops: Vec<PatchOp> },
}

impl Mutation {
    pub fn patch(id: impl Into<String>, ops: Vec<PatchOp>) -> Mutation {
        Mutation::Patch { id: id.into(), ops }
    }

    pub fn document_id(&self) -> &str {
        match self {
            Mutation::Create(doc) | Mutation::CreateIfNotExists(doc) | Mutation::CreateOrReplace(doc) => {
                doc.get("_id").and_then(Value::as_str).unwrap_or_default()
            }
            Mutation::Delete(id) | Mutation::Patch { id, .. } => id,
        }
    }

    /// The mutation as one or more entries of a `/data/mutate` `mutations` array. A patch with
    /// several operations becomes one entry per operation, so they apply in the order given
    /// rather than the fixed order of a combined patch body.
    pub fn to_json(&self) -> Vec<Value> {
        let wrap = |key: &str, value: Value| Value::Object(Map::from_iter([(key.to_owned(), value)]));
        match self {
            Mutation::Create(doc) => vec![wrap("create", doc.clone())],
            Mutation::CreateIfNotExists(doc) => vec![wrap("createIfNotExists", doc.clone())],
            Mutation::CreateOrReplace(doc) => vec![wrap("createOrReplace", doc.clone())],
            Mutation::Delete(id) => {
                vec![wrap("delete", Value::Object(Map::from_iter([("id".into(), id.as_str().into())])))]
            }
            Mutation::Patch { id, ops } => ops
                .iter()
                .map(|op| {
                    let mut body = patch::op_to_json(op);
                    body.insert("id".into(), Value::String(id.clone()));
                    wrap("patch", Value::Object(body))
                })
                .collect(),
        }
    }

    /// Parses one entry of a `mutations` array.
    pub fn from_json(value: &Value) -> Result<Mutation, String> {
        let object = value.as_object().ok_or("mutation must be an object")?;
        let (kind, body) = object.iter().next().ok_or("empty mutation")?;
        Ok(match kind.as_str() {
            "create" => Mutation::Create(body.clone()),
            "createIfNotExists" => Mutation::CreateIfNotExists(body.clone()),
            "createOrReplace" => Mutation::CreateOrReplace(body.clone()),
            "delete" => {
                Mutation::Delete(body.get("id").and_then(Value::as_str).ok_or("delete needs an id")?.to_owned())
            }
            "patch" => Mutation::Patch {
                id: body.get("id").and_then(Value::as_str).ok_or("patch needs an id")?.to_owned(),
                ops: patch::parse_patch(body)?,
            },
            other => return Err(format!("unsupported mutation {other}")),
        })
    }

    /// Applies the mutation to the current local version of its document, `None` meaning the
    /// document does not exist. Mutations Content Lake would reject (creating a document that
    /// exists, patching one that does not) leave the document unchanged.
    pub fn apply(&self, doc: Option<Value>) -> Option<Value> {
        match self {
            Mutation::Create(new) => Some(doc.unwrap_or_else(|| new.clone())),
            Mutation::CreateIfNotExists(new) => Some(doc.unwrap_or_else(|| new.clone())),
            Mutation::CreateOrReplace(new) => Some(new.clone()),
            Mutation::Delete(_) => None,
            Mutation::Patch { ops, .. } => doc.map(|mut doc| {
                patch::apply(&mut doc, ops);
                doc
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::path::parse;

    #[test]
    fn round_trips_wire_format() {
        let mutation = Mutation::patch(
            "drafts.a",
            vec![
                PatchOp::set_if_missing(parse("tags").unwrap(), json!([])),
                PatchOp::set(parse("title").unwrap(), json!("Hello")),
            ],
        );
        let wire = mutation.to_json();
        assert_eq!(
            wire,
            vec![
                json!({"patch": {"setIfMissing": {"tags": []}, "id": "drafts.a"}}),
                json!({"patch": {"set": {"title": "Hello"}, "id": "drafts.a"}}),
            ]
        );
        assert_eq!(Mutation::from_json(&wire[1]).unwrap().document_id(), "drafts.a");
    }

    #[test]
    fn applies_like_content_lake() {
        let doc = json!({"_id": "a", "title": "x"});
        assert_eq!(Mutation::Create(json!({"_id": "a"})).apply(Some(doc.clone())), Some(doc.clone()));
        assert_eq!(Mutation::Delete("a".into()).apply(Some(doc.clone())), None);
        let patch = Mutation::patch("a", vec![PatchOp::set(parse("title").unwrap(), json!("y"))]);
        assert_eq!(patch.apply(None), None);
        assert_eq!(patch.apply(Some(doc)), Some(json!({"_id": "a", "title": "y"})));
    }
}
