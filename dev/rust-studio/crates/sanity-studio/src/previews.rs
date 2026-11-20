//! Document previews: the rows of document lists, and referenced documents fetched in batches
//! (every preview asked for in the same tick goes out as one query).

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::releases::perspective;
use crate::replica::replica;
use crate::schema;
use crate::store::store;
use crate::util::{draft_id, prefix_last, preview_text, published_id};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DocPreview {
    /// The published id, also for documents that only exist as a draft.
    pub id: String,
    pub type_name: String,
    pub title: Option<String>,
    pub subtitle: Option<String>,
    /// An image asset reference.
    pub media: Option<String>,
    pub updated_at: Option<String>,
    /// The draft is what the preview shows, ie there are unpublished changes.
    pub draft: bool,
    /// Restored from the last visit and not confirmed current yet.
    #[serde(default, skip_serializing)]
    pub stale: bool,
}

impl DocPreview {
    /// Reads a document projected with [`schema::Schema::preview_projection`] in the `drafts`
    /// perspective.
    pub fn from_projection(value: &Value) -> Option<DocPreview> {
        let text = |key: &str| value.get(key).and_then(Value::as_str).map(str::to_owned);
        Some(DocPreview {
            id: published_id(value.get("_id")?.as_str()?).to_owned(),
            type_name: text("_type").unwrap_or_default(),
            title: value.get("title").and_then(preview_text),
            subtitle: value.get("subtitle").and_then(preview_text),
            media: text("media"),
            updated_at: text("_updatedAt"),
            draft: text("_originalId").is_some_and(|id| id.starts_with("drafts.")),
            stale: false,
        })
    }

    /// The preview of a document the store holds, from its current local version, so lists and
    /// headers follow edits as they are typed.
    pub fn from_document(id: &str, doc: &Value, draft: bool) -> DocPreview {
        let type_name = doc.get("_type").and_then(Value::as_str).unwrap_or_default().to_owned();
        let preview = schema::current().preview(&type_name);
        let field = |name: &Option<String>| name.as_ref().and_then(|name| doc.get(name));
        DocPreview {
            id: id.to_owned(),
            title: field(&preview.title).and_then(preview_text),
            subtitle: field(&preview.subtitle).and_then(preview_text),
            media: field(&preview.media)
                .and_then(|image| image.pointer("/asset/_ref"))
                .and_then(Value::as_str)
                .map(str::to_owned),
            updated_at: doc.get("_updatedAt").and_then(Value::as_str).map(str::to_owned),
            draft,
            type_name,
            stale: false,
        }
    }
}

/// The preview of `id` from the store when it holds the document, as the current perspective
/// shows it, tracking both.
pub fn local_preview(id: &str) -> Option<DocPreview> {
    let store = store();
    let draft = draft_id(id);
    if !store.is_loaded(&draft) && !store.is_loaded(id) {
        return None;
    }
    let doc = store.shown(id, &perspective())?;
    let original = doc.get("_id").and_then(Value::as_str).unwrap_or_default();
    Some(DocPreview { stale: store.is_stale(id), ..DocPreview::from_document(id, &doc, original != id) })
}

#[derive(Clone, Debug, PartialEq)]
pub enum PreviewState {
    Loading,
    Missing,
    /// The query kept failing, eg while offline.
    Failed,
    Ready(DocPreview),
}

/// How often a failed preview query is retried, a second apart and then doubling, before its
/// previews show as failed.
const PREVIEW_RETRIES: u32 = 3;

#[derive(Default)]
struct Cache {
    signals: RefCell<HashMap<String, ArcRwSignal<PreviewState>>>,
    pending: RefCell<Vec<String>>,
    scheduled: Cell<bool>,
}

thread_local! {
    static CACHE: Rc<Cache> = Rc::default();
}

/// The preview of a referenced document, fetched once and cached for the session. One whose
/// fetch failed is fetched again when it is asked for again.
pub fn preview(id: &str) -> ArcRwSignal<PreviewState> {
    let id = published_id(id).to_owned();
    CACHE.with(|cache| {
        let cached = cache.signals.borrow().get(&id).cloned();
        let signal = match cached {
            Some(signal) if !signal.with_untracked(|state| matches!(state, PreviewState::Failed)) => return signal,
            Some(signal) => {
                signal.set(PreviewState::Loading);
                signal
            }
            None => {
                let state = match replica().reference_preview(&id) {
                    Some(Some(preview)) => PreviewState::Ready(preview),
                    Some(None) => PreviewState::Missing,
                    None => PreviewState::Loading,
                };
                let cached = state != PreviewState::Loading;
                let signal = ArcRwSignal::new(state);
                cache.signals.borrow_mut().insert(id.clone(), signal.clone());
                if cached {
                    return signal;
                }
                signal
            }
        };
        cache.pending.borrow_mut().push(id);
        if !cache.scheduled.replace(true) {
            spawn_local(fetch_pending());
        }
        signal
    })
}

async fn fetch_pending() {
    let cache = CACHE.with(Rc::clone);
    cache.scheduled.set(false);
    let ids: Vec<String> = cache.pending.borrow_mut().drain(..).collect();
    if ids.is_empty() {
        return;
    }
    let schema = schema::current();
    let types: Vec<String> = schema.document_types().iter().map(|def| def.name.clone()).collect();
    let groq = format!("*[_id in $ids]{}", schema.preview_projection(&types));
    let params = Map::from_iter([("ids".to_owned(), json!(ids))]);
    let mut attempt = 0;
    let result = loop {
        match store().client().query_in("drafts", &groq, &params, "preview.references").await {
            Ok(result) => break Some(result),
            Err(_) if attempt < PREVIEW_RETRIES => {
                sanity_client::sleep(1000 << attempt).await;
                attempt += 1;
            }
            Err(_) => break None,
        }
    };
    let mut found: HashMap<String, DocPreview> = HashMap::new();
    if let Some(Value::Array(docs)) = &result {
        for preview in docs.iter().filter_map(DocPreview::from_projection) {
            found.insert(preview.id.clone(), preview);
        }
    }
    let signals = cache.signals.borrow().clone();
    for id in ids {
        if let Some(signal) = signals.get(&id) {
            signal.set(match result {
                Some(_) => found.remove(&id).map_or(PreviewState::Missing, PreviewState::Ready),
                None => PreviewState::Failed,
            });
        }
    }
}

/// Documents of any of `types` whose preview title matches `text` (by prefix, per word), most
/// recently edited first. An empty `text` lists the most recently edited documents.
/// Searches documents of `types` like the JS studio's `groq2024` strategy: any text field matches
/// through the search index, and a match in the preview title ranks higher.
pub async fn search(types: &[String], text: &str, limit: usize) -> Result<Vec<DocPreview>, sanity_client::Error> {
    let schema = schema::current();
    let text = text.trim();
    let projection = schema.preview_projection(types);
    let mut params = Map::from_iter([("types".to_owned(), json!(types))]);
    let groq = if text.is_empty() {
        format!("*[_type in $types] | order(_updatedAt desc) [0...{limit}] {projection}")
    } else {
        params.insert("q".to_owned(), json!(prefix_last(text)));
        params.insert("raw".to_owned(), json!(text));
        let boosts = schema
            .title_fields(types)
            .into_iter()
            .map(|(field, names)| format!("boost(_type in {} && {field} match text::query($q), 10)", json!(names)));
        let base = r#"([@, _id] match text::query($q) || _id in string::split($raw, "/"))"#;
        let score: Vec<String> = boosts.chain([base.to_owned()]).collect();
        format!(
            "*[_type in $types] | score({}) [_score > 0] | order(_score desc, _updatedAt desc) [0...{limit}] {projection}",
            score.join(", ")
        )
    };
    let result = store().client().query_in("drafts", &groq, &params, "search").await?;
    Ok(result.as_array().map(|docs| docs.iter().filter_map(DocPreview::from_projection).collect()).unwrap_or_default())
}

/// Which of `ids` exist in the dataset, so for published ids, which documents are published.
pub async fn existing_ids(ids: &[String]) -> Result<HashSet<String>, sanity_client::Error> {
    let params = Map::from_iter([("ids".to_owned(), json!(ids))]);
    let result = store().client().query_in("raw", "*[_id in $ids]._id", &params, "reference.published").await?;
    Ok(result
        .as_array()
        .map(|ids| ids.iter().filter_map(Value::as_str).map(str::to_owned).collect())
        .unwrap_or_default())
}

/// A CDN URL of an image asset cropped to a `size` × `size` square.
pub fn image_url(asset_ref: &str, size: u32) -> Option<String> {
    image_url_with(asset_ref, &format!("w={size}&h={size}&fit=crop"))
}

/// A CDN URL of an image asset with image pipeline parameters, eg `h=400&fit=max`.
pub fn image_url_with(asset_ref: &str, params: &str) -> Option<String> {
    let url = store().client().asset_url(asset_ref)?;
    Some(format!("{url}?{params}&auto=format"))
}
