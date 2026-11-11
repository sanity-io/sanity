//! The workspace schema, read from the schema the studio deploys to the dataset
//! (`_.schemas.default`, the manifest format `sanity schema deploy` writes), so the Rust studio
//! edits exactly the types the JS studio defines.

use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::Arc;

use sanity_client::random_key;
use serde::Deserialize;
use serde_json::{Map, Value};

use crate::util::start_case;

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct TypeDef {
    pub name: String,
    #[serde(rename = "type")]
    pub type_name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub fields: Vec<TypeDef>,
    pub of: Vec<TypeDef>,
    pub to: Vec<RefTarget>,
    pub options: Option<Value>,
    pub validation: Vec<ValidationGroup>,
    pub hidden: Option<Value>,
    pub read_only: Option<Value>,
    pub rows: Option<u32>,
    pub placeholder: Option<String>,
    pub fieldset: Option<String>,
    pub fieldsets: Vec<FieldsetDef>,
    pub deprecated: Option<Value>,
    pub initial_value: Option<Value>,
    /// Block definitions only.
    pub styles: Option<Vec<TitledValue>>,
    pub lists: Option<Vec<TitledValue>>,
    pub marks: Option<MarksDef>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
#[serde(default)]
pub struct TitledValue {
    pub value: String,
    pub title: Option<String>,
}

impl TitledValue {
    pub fn title(&self) -> String {
        self.title.clone().filter(|title| !title.is_empty()).unwrap_or_else(|| start_case(&self.value))
    }
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct MarksDef {
    pub decorators: Option<Vec<TitledValue>>,
    pub annotations: Option<Vec<TypeDef>>,
}

/// What a text block of a Portable Text array can hold.
#[derive(Clone, Debug)]
pub struct BlockConfig {
    pub styles: Vec<TitledValue>,
    pub lists: Vec<TitledValue>,
    pub decorators: Vec<TitledValue>,
    pub annotations: Vec<TypeDef>,
    pub inline: Vec<TypeDef>,
}

fn titled(items: &[(&str, &str)]) -> Vec<TitledValue> {
    items.iter().map(|(value, title)| TitledValue { value: (*value).into(), title: Some((*title).into()) }).collect()
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct RefTarget {
    #[serde(rename = "type")]
    pub type_name: String,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct FieldsetDef {
    pub name: String,
    pub title: Option<String>,
    pub options: Option<Value>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct ValidationGroup {
    pub level: String,
    pub rules: Vec<Rule>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Rule {
    pub flag: String,
    pub constraint: Value,
}

/// The built-in type a definition resolves to.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Kind {
    String,
    Text,
    Number,
    Boolean,
    Url,
    Email,
    Date,
    Datetime,
    Slug,
    Reference,
    CrossDatasetReference,
    Array,
    Object,
    Image,
    File,
    Geopoint,
    Block,
    Document,
    Unknown,
}

impl Kind {
    fn builtin(name: &str) -> Option<Kind> {
        Some(match name {
            "string" => Kind::String,
            "text" => Kind::Text,
            "number" => Kind::Number,
            "boolean" => Kind::Boolean,
            "url" => Kind::Url,
            "email" => Kind::Email,
            "date" => Kind::Date,
            "datetime" => Kind::Datetime,
            "slug" => Kind::Slug,
            "reference" => Kind::Reference,
            "crossDatasetReference" | "globalDocumentReference" => Kind::CrossDatasetReference,
            "array" => Kind::Array,
            "object" => Kind::Object,
            "image" => Kind::Image,
            "file" | "sanity.video" => Kind::File,
            "geopoint" => Kind::Geopoint,
            "block" => Kind::Block,
            "document" => Kind::Document,
            _ => return None,
        })
    }

    pub fn is_stringish(self) -> bool {
        matches!(self, Kind::String | Kind::Text | Kind::Url | Kind::Email | Kind::Slug)
    }

    /// Whether values are JSON objects (`isObjectSchemaType`).
    fn is_object(self) -> bool {
        matches!(
            self,
            Kind::Object
                | Kind::Document
                | Kind::Image
                | Kind::File
                | Kind::Geopoint
                | Kind::Slug
                | Kind::Reference
                | Kind::CrossDatasetReference
                | Kind::Block
        )
    }
}

/// A definition with named types followed down to a built-in: the kind, plus the fields, members
/// and options of the nearest definition that declares them.
#[derive(Clone, Debug)]
pub struct Resolved {
    pub kind: Kind,
    pub def: Arc<TypeDef>,
    pub fields: Arc<Vec<TypeDef>>,
    pub fieldsets: Arc<Vec<FieldsetDef>>,
    pub of: Arc<Vec<TypeDef>>,
    pub to: Vec<String>,
    pub options: Option<Value>,
    /// The `_type` of values of this definition: the named type, or the built-in name.
    pub type_name: String,
}

impl Resolved {
    pub fn option(&self, key: &str) -> Option<&Value> {
        self.options.as_ref()?.get(key)
    }

    /// `options.list` as `(value, title)` pairs.
    pub fn list_options(&self) -> Option<Vec<(Value, String)>> {
        let list = self.option("list")?.as_array()?;
        Some(
            list.iter()
                .map(|item| match item {
                    Value::Object(map) => {
                        let value = map.get("value").cloned().unwrap_or(Value::Null);
                        let title = map
                            .get("title")
                            .and_then(Value::as_str)
                            .map(str::to_owned)
                            .unwrap_or_else(|| crate::util::preview_text(&value).unwrap_or_default());
                        (value, title)
                    }
                    other => (other.clone(), crate::util::preview_text(other).unwrap_or_default()),
                })
                .collect(),
        )
    }
}

#[derive(Clone, Debug, Default)]
pub struct Preview {
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub media: Option<String>,
}

#[derive(Debug, Default)]
pub struct Schema {
    types: HashMap<String, Arc<TypeDef>>,
    document_types: Vec<Arc<TypeDef>>,
    previews: HashMap<String, Preview>,
}

const TITLE_CANDIDATES: [&str; 6] = ["title", "name", "label", "heading", "header", "caption"];
const SUBTITLE_CANDIDATES: [&str; 7] = ["description", "subtitle", "title", "name", "label", "heading", "header"];
const TITLE_FALLBACK: &str = "coalesce(title, name, label, heading, header, caption)";
/// `DEFAULT_MAX_RECURSION_DEPTH` of the initial value resolver.
const INITIAL_VALUE_DEPTH: usize = 10;

impl Schema {
    /// Parses the `schema` array of a `system.schema` document.
    pub fn from_manifest(types: &Value) -> Schema {
        let defs: Vec<TypeDef> = serde_json::from_value(types.clone()).unwrap_or_default();
        let mut schema = Schema::default();
        for def in defs {
            let def = Arc::new(def);
            schema.types.insert(def.name.clone(), def.clone());
        }
        let mut document_types: Vec<Arc<TypeDef>> = schema
            .types
            .values()
            .filter(|def| {
                def.type_name == "document" && !def.name.starts_with("sanity.") && !def.name.starts_with("system.")
            })
            .cloned()
            .collect();
        document_types.sort_by_key(|def| title_of(def).to_lowercase());
        let previews = document_types.iter().map(|def| (def.name.clone(), schema.guess_preview(def))).collect();
        schema.document_types = document_types;
        schema.previews = previews;
        schema
    }

    pub fn document_types(&self) -> &[Arc<TypeDef>] {
        &self.document_types
    }

    pub fn get(&self, name: &str) -> Option<&Arc<TypeDef>> {
        self.types.get(name)
    }

    pub fn type_title(&self, name: &str) -> String {
        self.types.get(name).map_or_else(|| start_case(name), |def| title_of(def))
    }

    pub fn preview(&self, type_name: &str) -> Preview {
        self.previews.get(type_name).cloned().unwrap_or_default()
    }

    /// A GROQ projection of the preview of documents of any of `types`: `title` and `subtitle`
    /// hold the raw field values, `media` an image asset reference.
    pub fn preview_projection(&self, types: &[String]) -> String {
        let select = |pick: &dyn Fn(&Preview) -> Option<String>, fallback: &str| {
            let arms: Vec<String> = types
                .iter()
                .filter_map(|name| pick(&self.preview(name)).map(|field| format!("_type == {name:?} => {field}")))
                .collect();
            match arms.as_slice() {
                [] => fallback.to_owned(),
                [_] if types.len() == 1 => pick(&self.preview(&types[0])).unwrap_or_default(),
                _ => format!("select({}, {fallback})", arms.join(", ")),
            }
        };
        let title = select(&|preview| preview.title.clone(), TITLE_FALLBACK);
        let subtitle = select(&|preview| preview.subtitle.clone(), "null");
        let media = select(&|preview| preview.media.as_ref().map(|media| format!("{media}.asset._ref")), "null");
        format!(
            r#"{{_id, _originalId, _type, _updatedAt, "title": {title}, "subtitle": {subtitle}, "media": {media}}}"#
        )
    }

    /// The preview title fields of `types`, each with the types that use it, in order of first use.
    pub fn title_fields(&self, types: &[String]) -> Vec<(String, Vec<String>)> {
        let mut fields: Vec<(String, Vec<String>)> = Vec::new();
        for name in types {
            let Some(field) = self.preview(name).title else { continue };
            match fields.iter_mut().find(|(existing, _)| *existing == field) {
                Some((_, names)) => names.push(name.clone()),
                None => fields.push((field, vec![name.clone()])),
            }
        }
        fields
    }

    pub fn resolve(&self, def: &TypeDef) -> Resolved {
        let mut fields = (!def.fields.is_empty()).then(|| Arc::new(def.fields.clone()));
        let mut fieldsets = (!def.fieldsets.is_empty()).then(|| Arc::new(def.fieldsets.clone()));
        let mut of = (!def.of.is_empty()).then(|| Arc::new(def.of.clone()));
        let mut to: Vec<String> = def.to.iter().map(|target| target.type_name.clone()).collect();
        let mut options = def.options.clone();
        let mut current = def.type_name.clone();
        let mut kind = Kind::builtin(&current);
        let mut depth = 0;
        while kind.is_none() && depth < 16 {
            let Some(named) = self.types.get(&current) else { break };
            fields = fields.or_else(|| (!named.fields.is_empty()).then(|| Arc::new(named.fields.clone())));
            fieldsets = fieldsets.or_else(|| (!named.fieldsets.is_empty()).then(|| Arc::new(named.fieldsets.clone())));
            of = of.or_else(|| (!named.of.is_empty()).then(|| Arc::new(named.of.clone())));
            if to.is_empty() {
                to = named.to.iter().map(|target| target.type_name.clone()).collect();
            }
            options = options.or_else(|| named.options.clone());
            current = named.type_name.clone();
            kind = Kind::builtin(&current);
            depth += 1;
        }

        Resolved {
            kind: kind.unwrap_or(Kind::Unknown),
            def: Arc::new(def.clone()),
            fields: fields.unwrap_or_default(),
            fieldsets: fieldsets.unwrap_or_default(),
            of: of.unwrap_or_default(),
            to,
            options,
            type_name: def.type_name.clone(),
        }
    }

    /// The block configuration of `def`, each part from the nearest definition that declares it,
    /// with the defaults `@sanity/schema` gives a plain `{type: 'block'}`.
    pub fn block_config(&self, def: &TypeDef) -> BlockConfig {
        let mut chain = vec![def];
        let mut current = def.type_name.as_str();
        while Kind::builtin(current).is_none() && chain.len() < 16 {
            let Some(named) = self.types.get(current) else { break };
            chain.push(named);
            current = &named.type_name;
        }
        let pick = |get: &dyn Fn(&TypeDef) -> Option<Vec<TitledValue>>, default: &[(&str, &str)]| {
            chain.iter().find_map(|def| get(def)).unwrap_or_else(|| titled(default))
        };
        BlockConfig {
            styles: pick(
                &|def| def.styles.clone(),
                &[
                    ("normal", "Normal"),
                    ("h1", "Heading 1"),
                    ("h2", "Heading 2"),
                    ("h3", "Heading 3"),
                    ("h4", "Heading 4"),
                    ("h5", "Heading 5"),
                    ("h6", "Heading 6"),
                    ("blockquote", "Quote"),
                ],
            ),
            lists: pick(&|def| def.lists.clone(), &[("bullet", "Bulleted list"), ("number", "Numbered list")]),
            decorators: pick(
                &|def| def.marks.as_ref().and_then(|marks| marks.decorators.clone()),
                &[
                    ("strong", "Strong"),
                    ("em", "Italic"),
                    ("code", "Code"),
                    ("underline", "Underline"),
                    ("strike-through", "Strike"),
                ],
            ),
            annotations: chain
                .iter()
                .find_map(|def| def.marks.as_ref().and_then(|marks| marks.annotations.clone()))
                .unwrap_or_else(|| {
                    vec![TypeDef {
                        name: "link".into(),
                        type_name: "object".into(),
                        title: Some("Link".into()),
                        fields: vec![TypeDef { name: "href".into(), type_name: "url".into(), ..TypeDef::default() }],
                        ..TypeDef::default()
                    }]
                }),
            inline: chain.iter().find(|def| !def.of.is_empty()).map(|def| def.of.clone()).unwrap_or_default(),
        }
    }

    /// The initial value of a new document of `type_name` (`resolveInitialValueForType`). The
    /// deployed schema only keeps static initial values, so resolver functions are left out.
    pub fn initial_document(&self, type_name: &str) -> Option<Value> {
        let def = self.types.get(type_name)?;
        self.initial_value(def, type_name, INITIAL_VALUE_DEPTH)
    }

    /// The initial value of `def`, whose values have the `_type` `type_name`.
    fn initial_value(&self, def: &TypeDef, type_name: &str, depth: usize) -> Option<Value> {
        if depth == 0 {
            return None;
        }
        let resolved = self.resolve(def);
        let own = self.own_initial_value(def);
        if resolved.kind == Kind::Array {
            let Some(Value::Array(items)) = own else { return None };
            let items = items.into_iter().map(|item| {
                let Value::Object(item) = item else { return item };
                let item_type = item.get("_type").and_then(Value::as_str).unwrap_or("object");
                let member = if item_type == "object" && resolved.of.len() == 1 {
                    resolved.of.first()
                } else {
                    resolved.of.iter().find(|member| member_type_name(member) == item_type)
                };
                let Some(member) = member.filter(|member| self.resolve(member).kind.is_object()) else {
                    return Value::Object(item);
                };
                // The array's own initial items win over the initial values of their type.
                let mut value = match self.initial_value(member, &member_type_name(member), depth - 1) {
                    Some(Value::Object(map)) => map,
                    _ => Map::new(),
                };
                deep_assign(&mut value, item);
                value.insert("_key".into(), Value::String(random_key(12)));
                Value::Object(value)
            });
            return Some(Value::Array(items.collect()));
        }
        if !resolved.kind.is_object() {
            return own;
        }

        let mut value = Map::new();
        for field in resolved.fields.iter() {
            if let Some(field_value) = self.initial_value(field, &field.type_name, depth - 1).filter(|v| !v.is_null()) {
                value.insert(field.name.clone(), field_value);
            }
        }
        if let Some(Value::Object(own)) = own {
            deep_assign(&mut value, own);
        }
        let mut value = Value::Object(value);
        if is_deep_empty(&value) {
            return None;
        }
        if type_name != "object" {
            value["_type"] = Value::String(type_name.to_owned());
        }
        Some(value)
    }

    /// The `initialValue` of `def`, or else of the named type it is declared as.
    fn own_initial_value(&self, def: &TypeDef) -> Option<Value> {
        let mut value = def.initial_value.clone();
        let mut current = def.type_name.as_str();
        for _ in 0..16 {
            if value.is_some() || Kind::builtin(current).is_some() {
                break;
            }
            let Some(named) = self.types.get(current) else { break };
            value = named.initial_value.clone();
            current = &named.type_name;
        }
        value
    }

    /// `guessPreviewConfig`: a title-like string field, a description-like subtitle, and the
    /// first image as media.
    fn guess_preview(&self, def: &TypeDef) -> Preview {
        self.guess_fields_preview(&def.fields)
    }

    /// `guessPreviewConfig` over the fields of an object, for array item previews.
    pub fn guess_fields_preview(&self, fields: &[TypeDef]) -> Preview {
        let stringish: Vec<&str> = fields
            .iter()
            .filter(|field| self.resolve(field).kind.is_stringish())
            .map(|field| field.name.as_str())
            .collect();
        let title = TITLE_CANDIDATES
            .iter()
            .find(|candidate| stringish.contains(candidate))
            .copied()
            .or_else(|| stringish.first().copied())
            .map(str::to_owned);
        let subtitle = SUBTITLE_CANDIDATES
            .iter()
            .find(|candidate| stringish.contains(candidate) && title.as_deref() != Some(**candidate))
            .map(|candidate| (*candidate).to_owned());
        let media = fields.iter().find(|field| self.resolve(field).kind == Kind::Image).map(|field| field.name.clone());
        Preview { title, subtitle, media }
    }
}

thread_local! {
    static CURRENT: RefCell<Arc<Schema>> = RefCell::default();
}

/// The workspace schema; empty until it has loaded.
pub fn current() -> Arc<Schema> {
    CURRENT.with(|current| current.borrow().clone())
}

pub fn set_current(schema: Arc<Schema>) {
    CURRENT.with(|current| *current.borrow_mut() = schema);
}

pub fn title_of(def: &TypeDef) -> String {
    def.title.clone().filter(|title| !title.is_empty()).unwrap_or_else(|| start_case(&def.name))
}

/// The `_type` of a new array member: its name, or the type it is declared as.
pub fn member_type_name(member: &TypeDef) -> String {
    if member.name.is_empty() { member.type_name.clone() } else { member.name.clone() }
}

/// `deepAssign` of the initial value resolver: `source` over `target`, merging nested objects.
fn deep_assign(target: &mut Map<String, Value>, source: Map<String, Value>) {
    for (key, value) in source {
        match (target.get_mut(&key), value) {
            (Some(Value::Object(target)), Value::Object(source)) => deep_assign(target, source),
            (_, value) => {
                target.insert(key, value);
            }
        }
    }
}

/// `isDeepEmpty`: null, or objects and arrays with nothing but `_type`, `_key` and empty values.
fn is_deep_empty(value: &Value) -> bool {
    match value {
        Value::Null => true,
        Value::Array(items) => items.iter().all(is_deep_empty),
        Value::Object(map) => map.iter().all(|(key, value)| key == "_type" || key == "_key" || is_deep_empty(value)),
        _ => false,
    }
}

pub fn is_hidden(def: &TypeDef) -> bool {
    def.hidden.as_ref().is_some_and(|hidden| hidden == &Value::Bool(true))
}

pub fn is_read_only(def: &TypeDef) -> bool {
    def.read_only.as_ref().is_some_and(|read_only| read_only == &Value::Bool(true))
}

#[derive(Clone, Debug, PartialEq)]
pub struct Marker {
    pub level: String,
    pub message: String,
}

fn number(value: &Value) -> Option<f64> {
    value.as_f64()
}

/// The validation rules the manifest carries that do not need a function to evaluate.
pub fn validate(resolved: &Resolved, value: Option<&Value>) -> Vec<Marker> {
    let mut markers = Vec::new();
    let empty = match value {
        None | Some(Value::Null) => true,
        Some(Value::String(text)) => text.is_empty(),
        Some(Value::Array(items)) => items.is_empty(),
        _ => false,
    };
    for group in &resolved.def.validation {
        let level = if group.level.is_empty() { "error".to_owned() } else { group.level.clone() };
        let mut push = |message: String| markers.push(Marker { level: level.clone(), message });
        for rule in &group.rules {
            match rule.flag.as_str() {
                "presence" if rule.constraint == "required" && empty => push("Required".into()),
                _ if empty => {}
                "min" | "max" | "length" => {
                    let Some(limit) = number(&rule.constraint) else { continue };
                    let (measure, unit) = match value {
                        Some(Value::String(text)) => (text.chars().count() as f64, Some("characters")),
                        Some(Value::Array(items)) => (items.len() as f64, Some("items")),
                        Some(Value::Number(n)) => (n.as_f64().unwrap_or(0.0), None),
                        _ => continue,
                    };
                    let message = match (rule.flag.as_str(), unit) {
                        ("min", Some(unit)) if measure < limit => Some(format!("Must have at least {limit} {unit}")),
                        ("max", Some(unit)) if measure > limit => Some(format!("Must have at most {limit} {unit}")),
                        ("length", Some(unit)) if measure != limit => Some(format!("Must have exactly {limit} {unit}")),
                        ("min", None) if measure < limit => Some(format!("Must be greater than or equal to {limit}")),
                        ("max", None) if measure > limit => Some(format!("Must be less than or equal to {limit}")),
                        _ => None,
                    };
                    if let Some(message) = message {
                        push(message);
                    }
                }
                "integer" => {
                    if value.and_then(Value::as_f64).is_some_and(|n| n.fract() != 0.0) {
                        push("Must be an integer".into());
                    }
                }
                "email" => {
                    if value.and_then(Value::as_str).is_some_and(|text| !text.contains('@') || text.contains(' ')) {
                        push("Must be a valid email address".into());
                    }
                }
                "uri" => {
                    if value.and_then(Value::as_str).is_some_and(|text| !text.contains(':') && !text.starts_with('/')) {
                        push("Not a valid URL".into());
                    }
                }
                "valid" => {
                    if let (Some(allowed), Some(value)) = (rule.constraint.as_array(), value)
                        && !allowed.contains(value)
                    {
                        push("Value did not match any allowed values".into());
                    }
                }
                _ => {}
            }
        }
    }
    markers
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn schema() -> Schema {
        Schema::from_manifest(&json!([
            {"name": "author", "type": "document", "fields": [
                {"name": "name", "type": "string", "validation": [{"level": "error", "rules": [{"flag": "presence", "constraint": "required"}, {"flag": "min", "constraint": 2}]}]},
                {"name": "bio", "type": "localeText"},
                {"name": "image", "type": "image"},
                {"name": "role", "type": "string", "options": {"list": [{"title": "Developer", "value": "developer"}, "designer"]}}
            ]},
            {"name": "localeText", "type": "object", "fields": [{"name": "en", "type": "text"}]},
            {"name": "myImage", "type": "image", "options": {"hotspot": true}},
            {"name": "book", "type": "document", "fields": [
                {"name": "cover", "type": "myImage"},
                {"name": "reviews", "type": "array", "of": [{"name": "review", "type": "object", "fields": [{"name": "title", "type": "string"}]}]},
                {"name": "author", "type": "reference", "to": [{"type": "author"}]}
            ]},
            {"name": "sanity.imageAsset", "type": "document", "fields": []}
        ]))
    }

    #[test]
    fn resolves_named_types_down_to_builtins() {
        let schema = schema();
        let author = schema.get("author").unwrap().clone();
        let bio = schema.resolve(&author.fields[1]);
        assert_eq!(bio.kind, Kind::Object);
        assert_eq!(bio.fields[0].name, "en");
        let book = schema.get("book").unwrap().clone();
        let cover = schema.resolve(&book.fields[0]);
        assert_eq!((cover.kind, cover.option("hotspot")), (Kind::Image, Some(&json!(true))));
        let reviews = schema.resolve(&book.fields[1]);
        assert_eq!((reviews.kind, member_type_name(&reviews.of[0])), (Kind::Array, "review".to_owned()));
        assert_eq!(schema.resolve(&book.fields[2]).to, ["author"]);
        let role = schema.resolve(&author.fields[3]).list_options().unwrap();
        assert_eq!(
            role,
            vec![(json!("developer"), "Developer".to_owned()), (json!("designer"), "designer".to_owned())]
        );
    }

    #[test]
    fn lists_document_types_and_guesses_previews() {
        let schema = schema();
        let names: Vec<&str> = schema.document_types().iter().map(|def| def.name.as_str()).collect();
        assert_eq!(names, ["author", "book"]);
        let preview = schema.preview("author");
        assert_eq!((preview.title.as_deref(), preview.media.as_deref()), (Some("name"), Some("image")));
        assert_eq!(schema.preview("book").media.as_deref(), Some("cover"));
        assert_eq!(
            schema.preview_projection(&["author".into()]),
            r#"{_id, _originalId, _type, _updatedAt, "title": name, "subtitle": null, "media": image.asset._ref}"#
        );
        assert!(schema.preview_projection(&["author".into(), "book".into()]).contains(
            r#""title": select(_type == "author" => name, coalesce(title, name, label, heading, header, caption))"#
        ));
    }

    #[test]
    fn resolves_static_initial_values_like_the_js_resolver() {
        let schema = Schema::from_manifest(&json!([
            {"name": "post", "type": "document", "initialValue": {"meta": {"lang": "nb"}}, "fields": [
                {"name": "title", "type": "string", "initialValue": "Untitled"},
                {"name": "draft", "type": "boolean", "initialValue": false},
                {"name": "meta", "type": "meta"},
                {"name": "inline", "type": "object", "fields": [{"name": "count", "type": "number", "initialValue": 1}]},
                {"name": "tags", "type": "array", "of": [{"type": "string"}], "initialValue": ["a"]},
                {"name": "items", "type": "array", "initialValue": [{"_type": "item", "n": 2}], "of": [
                    {"name": "item", "type": "object", "fields": [
                        {"name": "label", "type": "string", "initialValue": "x"},
                        {"name": "n", "type": "number", "initialValue": 1}
                    ]}
                ]},
                {"name": "empty", "type": "plain"}
            ]},
            {"name": "meta", "type": "object", "initialValue": {"lang": "en", "region": "eu"}, "fields": [
                {"name": "lang", "type": "string"},
                {"name": "region", "type": "string"}
            ]},
            {"name": "plain", "type": "object", "fields": [{"name": "x", "type": "string"}]}
        ]));
        let mut value = schema.initial_document("post").unwrap();
        let key = value["items"][0]["_key"].take();
        assert_eq!(key.as_str().map(str::len), Some(12));
        assert_eq!(
            value,
            json!({
                "_type": "post",
                "title": "Untitled",
                "draft": false,
                "meta": {"_type": "meta", "lang": "nb", "region": "eu"},
                "inline": {"count": 1},
                "tags": ["a"],
                "items": [{"_type": "item", "label": "x", "n": 2, "_key": null}],
            })
        );
        assert_eq!(schema.initial_document("plain"), None);
    }

    #[test]
    fn validates_required_and_length() {
        let schema = schema();
        let author = schema.get("author").unwrap().clone();
        let name = schema.resolve(&author.fields[0]);
        assert_eq!(validate(&name, None)[0].message, "Required");
        assert_eq!(validate(&name, Some(&json!("a")))[0].message, "Must have at least 2 characters");
        assert!(validate(&name, Some(&json!("ab"))).is_empty());
    }
}
