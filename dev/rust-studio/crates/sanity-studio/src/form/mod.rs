//! The document form: inputs generated from the schema that read the document from the store
//! and write patches back through it, like the JS form builder's `FormInput` tree.

mod array;
mod inputs;
mod object;
mod portable_text;
mod reference;

use std::sync::Arc;

use leptos::prelude::*;
use sanity_mutator::{PatchOp, Path, Segment};
use sanity_ui::prelude::*;
use serde_json::{Value, json};

use crate::schema::{self, Kind, Marker, Resolved, TypeDef, is_hidden, is_read_only, title_of, validate};
use crate::store::store;

pub use object::Fields;

/// Where an input writes: a path in the document, plus the objects above it that have to exist
/// first (each written with `setIfMissing` when it is missing, like the JS form builder does).
#[derive(Clone)]
pub struct Target {
    pub published: Arc<str>,
    pub type_name: Arc<str>,
    pub doc: Memo<Option<Value>>,
    pub read_only: Signal<bool>,
    pub path: Path,
    ensure: Arc<Vec<(Path, Value)>>,
}

impl Target {
    pub fn root(published: &str, type_name: &str, doc: Memo<Option<Value>>, read_only: Signal<bool>) -> Target {
        Target {
            published: published.into(),
            type_name: type_name.into(),
            doc,
            read_only,
            path: Vec::new(),
            ensure: Arc::new(Vec::new()),
        }
    }

    /// The value at the path, tracked.
    pub fn value(&self) -> Option<Value> {
        self.doc.with(|doc| doc.as_ref().and_then(|doc| sanity_mutator::path::get(doc, &self.path)).cloned())
    }

    pub fn value_untracked(&self) -> Option<Value> {
        self.doc.with_untracked(|doc| doc.as_ref().and_then(|doc| sanity_mutator::path::get(doc, &self.path)).cloned())
    }

    pub fn child(&self, segment: Segment) -> Target {
        let mut path = self.path.clone();
        path.push(segment);
        Target { path, ..self.clone() }
    }

    /// A field of the object at this path, which gets created as `{_type}` (or `{}` for
    /// anonymous objects) before the field is written.
    pub fn object_field(&self, object_type: &str, field: &str) -> Target {
        let mut ensure = (*self.ensure).clone();
        if !self.path.is_empty() {
            let initial = if object_type == "object" { json!({}) } else { json!({"_type": object_type}) };
            ensure.push((self.path.clone(), initial));
        }
        let mut path = self.path.clone();
        path.push(Segment::attr(field));
        Target { path, ensure: Arc::new(ensure), ..self.clone() }
    }

    pub fn patch(&self, ops: Vec<PatchOp>) {
        let mut all: Vec<PatchOp> = self.doc.with_untracked(|doc| {
            self.ensure
                .iter()
                .filter(|(path, _)| doc.as_ref().and_then(|doc| sanity_mutator::path::get(doc, path)).is_none())
                .map(|(path, initial)| PatchOp::set_if_missing(path.clone(), initial.clone()))
                .collect()
        });
        all.extend(ops);
        store().edit(&self.published, &self.type_name, all);
    }

    pub fn set(&self, value: Value) {
        self.patch(vec![PatchOp::set(self.path.clone(), value)]);
    }

    pub fn unset(&self) {
        self.patch(vec![PatchOp::unset(self.path.clone())]);
    }
}

fn marker_color(level: &str) -> &'static str {
    match level {
        "warning" => {
            "--card-fg-color: var(--card-badge-caution-fg-color); --card-icon-color: var(--card-badge-caution-icon-color);"
        }
        "info" => {
            "--card-fg-color: var(--card-badge-primary-fg-color); --card-icon-color: var(--card-badge-primary-icon-color);"
        }
        _ => {
            "--card-fg-color: var(--card-badge-critical-fg-color); --card-icon-color: var(--card-badge-critical-icon-color);"
        }
    }
}

#[component]
pub fn Markers(#[prop(into)] markers: Signal<Vec<Marker>>) -> impl IntoView {
    move || {
        markers
            .get()
            .into_iter()
            .map(|marker| {
                let icon = if marker.level == "error" { IconName::ErrorOutline } else { IconName::WarningOutline };
                view! {
                    <div style=marker_color(&marker.level)>
                        <Flex gap=2 align="center">
                            <Text size=1>
                                <Icon icon=icon />
                            </Text>
                            <Text size=1>{marker.message}</Text>
                        </Flex>
                    </div>
                }
            })
            .collect_view()
    }
}

#[component]
pub fn FieldHeader(#[prop(into)] title: String, description: Option<String>) -> impl IntoView {
    view! {
        <Stack space=2>
            <Text size=1 weight=FontWeight::Medium>
                {title}
            </Text>
            {description.map(|description| view! { <Text size=1 muted=true>{description}</Text> })}
        </Stack>
    }
}

/// The inline editor for a value of `resolved`, without the field header.
pub fn render_input(target: Target, resolved: Arc<Resolved>, level: usize) -> AnyView {
    match resolved.kind {
        Kind::String | Kind::Url | Kind::Email | Kind::Text | Kind::Number | Kind::Date | Kind::Datetime => {
            inputs::primitive_input(target, resolved)
        }
        Kind::Boolean => inputs::boolean_input(target, resolved),
        Kind::Slug => view! { <inputs::SlugInput target=target resolved=resolved /> }.into_any(),
        Kind::Reference => view! { <reference::ReferenceInput target=target resolved=resolved /> }.into_any(),
        Kind::Array => array::array_input(target, resolved, level),
        Kind::Object | Kind::Image | Kind::File | Kind::Geopoint | Kind::Document => {
            view! { <object::ObjectInput target=target resolved=resolved level=level /> }.into_any()
        }
        Kind::Block => portable_text::unsupported_block(),
        Kind::CrossDatasetReference | Kind::Unknown => {
            view! { <Unsupported target=target type_name=resolved.type_name.clone() /> }.into_any()
        }
    }
}

#[component]
fn Unsupported(target: Target, type_name: String) -> impl IntoView {
    let json = move || {
        target.value().map(|value| {
            let text = serde_json::to_string_pretty(&value).unwrap_or_default();
            if text.len() > 600 { format!("{}…", &text[..text.floor_char_boundary(600)]) } else { text }
        })
    };
    view! {
        <Card border=true radius=2 padding=Pad::all(3) tone=CardTone::Transparent>
            <Stack space=3>
                <Text size=1 muted=true>
                    {format!("Editing {type_name} fields isn't ported to the Rust studio yet.")}
                </Text>
                {move || json().map(|json| view! { <Code size=1>{json}</Code> })}
            </Stack>
        </Card>
    }
}

/// One field of an object: header, input and validation.
pub fn render_field(parent: &Target, object_type: &str, field: &TypeDef, level: usize) -> AnyView {
    if is_hidden(field) {
        return ().into_any();
    }
    let schema = schema::current();
    let resolved = Arc::new(schema.resolve(field));
    let mut target = parent.object_field(object_type, &field.name);
    if is_read_only(field) {
        target.read_only = Signal::stored(true);
    } else {
        let parent_read_only = parent.read_only;
        target.read_only = Signal::derive(move || parent_read_only.get());
    }
    let title = title_of(field);
    let description = field.description.clone().filter(|description| !description.is_empty());
    let markers = {
        let target = target.clone();
        let resolved = resolved.clone();
        Signal::derive(move || validate(&resolved, target.value().as_ref()))
    };

    if resolved.kind == Kind::Boolean {
        return view! {
            <Stack space=3>
                <Flex gap=3 align="flex-start">
                    <div style="flex: none;">{inputs::boolean_input(target, resolved)}</div>
                    <Box flex=1>
                        <FieldHeader title=title description=description />
                    </Box>
                </Flex>
                <Markers markers=markers />
            </Stack>
        }
        .into_any();
    }

    let nested = matches!(resolved.kind, Kind::Object | Kind::Image | Kind::File | Kind::Geopoint);
    view! {
        <Stack space=3>
            <FieldHeader title=title description=description />
            {render_input(target, resolved, level + usize::from(nested))}
            <Markers markers=markers />
        </Stack>
    }
    .into_any()
}

/// The references that are strong once the document is published, by the title of the top-level
/// field they are in: references to documents that aren't published are weak with
/// `_strengthenOnPublish` until then. The JS studio's reference validation reports each one
/// whose document isn't published, since the Content Lake rejects publishing it.
pub fn references_to_publish(type_name: &str, doc: &Value) -> Vec<(String, String)> {
    fn collect(value: &Value, title: &str, out: &mut Vec<(String, String)>) {
        match value {
            Value::Object(map) => {
                // Cross-dataset and global document references point outside this dataset.
                let local = !map.contains_key("_dataset") && !map.contains_key("_projectId");
                if let Some(id) = map.get("_ref").and_then(Value::as_str).filter(|id| local && !id.contains(':')) {
                    let weak = map.get("_weak").and_then(Value::as_bool).unwrap_or(false);
                    let stays_weak = map
                        .get("_strengthenOnPublish")
                        .is_none_or(|strengthen| strengthen.get("weak").and_then(Value::as_bool).unwrap_or(false));
                    if !(weak && stays_weak) {
                        out.push((title.to_owned(), id.to_owned()));
                    }
                    return;
                }
                map.values().for_each(|value| collect(value, title, out));
            }
            Value::Array(items) => items.iter().for_each(|item| collect(item, title, out)),
            _ => {}
        }
    }
    let schema = schema::current();
    let Some(def) = schema.get(type_name) else { return Vec::new() };
    let mut out = Vec::new();
    for field in &def.fields {
        if let Some(value) = doc.get(&field.name) {
            collect(value, &title_of(field), &mut out);
        }
    }
    out
}

/// Validation markers of the top-level fields of a document, for the footer.
pub fn document_markers(type_name: &str, doc: Option<&Value>) -> Vec<Marker> {
    let schema = schema::current();
    let Some(def) = schema.get(type_name) else { return Vec::new() };
    def.fields
        .iter()
        .filter(|field| !is_hidden(field))
        .flat_map(|field| {
            let resolved = schema.resolve(field);
            let title = title_of(field);
            validate(&resolved, doc.and_then(|doc| doc.get(&field.name)))
                .into_iter()
                .map(move |marker| Marker { message: format!("{title}: {}", marker.message), ..marker })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collects_the_references_publishing_makes_strong() {
        schema::set_current(Arc::new(schema::Schema::from_manifest(&json!([
            {"name": "author", "type": "document", "fields": [
                {"name": "bestFriend", "type": "reference", "to": [{"type": "author"}]},
                {"name": "favoriteBooks", "title": "Favorite books", "type": "array", "of": [{"type": "reference", "to": [{"type": "book"}]}]},
                {"name": "related", "type": "reference", "weak": true, "to": [{"type": "author"}]},
                {"name": "other", "type": "crossDatasetReference", "dataset": "other", "to": [{"type": "x"}]}
            ]}
        ]))));
        let doc = json!({
            "_type": "author",
            "bestFriend": {"_type": "reference", "_ref": "a"},
            "favoriteBooks": [
                {"_key": "1", "_type": "reference", "_ref": "b", "_weak": true, "_strengthenOnPublish": {"type": "book"}},
                {"_key": "2", "_type": "reference", "_ref": "c", "_weak": true}
            ],
            "related": {"_type": "reference", "_ref": "d", "_weak": true, "_strengthenOnPublish": {"type": "author", "weak": true}},
            "other": {"_type": "crossDatasetReference", "_ref": "e", "_dataset": "other"}
        });
        assert_eq!(
            references_to_publish("author", &doc),
            [("Best Friend".to_owned(), "a".to_owned()), ("Favorite books".to_owned(), "b".to_owned())]
        );
    }
}
