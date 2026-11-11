//! The document replica: a compressed copy of every document small enough to keep, warmed up in
//! the background after login and kept current by one listener for the whole dataset, so lists
//! sort, search and scroll without queries and documents open without waiting for snapshots.
//!
//! A document is kept as the JSON text the query API returned, compressed with lz4 against a
//! dictionary per type (made from the type's first documents, since documents of a type share
//! their keys and much of their text), and decompressed whenever a row or a pane shows it.
//!
//! Rows and panes follow one rule, here and in the JS-lite studio: a row shows a skeleton until
//! every document of its group (published, draft and release versions) is cached, and a row
//! without one opens its document without a loading state. Both studios get the same memory
//! budget (`?cache=<MiB>`, 24 MiB by default) and warm up the same way, type by type with the
//! types of open lists first; what fits differs.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, VecDeque};
use std::rc::Rc;
use std::sync::Arc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{Client, ListenEvent, ListenOptions, Listener, QueriedDocument, sleep};
use serde::Deserialize;
use serde_json::value::RawValue;
use serde_json::{Map, Value, json};

use crate::list::Ordering;
use crate::previews::DocPreview;
use crate::releases::Perspective;
use crate::schema;
use crate::util::{now_ms, preview_text, wasm_memory};

pub const DEFAULT_BUDGET_MIB: f64 = 24.0;
/// Larger documents are left out of the warm-up and load when a row shows them.
const DOC_LIMIT: usize = 64 * 1024;
/// Types whose first documents average more than this, or have none small enough to keep, are
/// left out of the warm-up.
const TYPE_AVERAGE_LIMIT: usize = 16 * 1024;
const FIRST_PAGE: usize = 4;
const PAGE_BYTES: usize = 1_500_000;
const WARM_WORKERS: usize = 3;
const DICTIONARY_BYTES: usize = 16 * 1024;
/// Groups fetched per on-demand query, and how many of those run at once.
const FETCH_BATCH: usize = 25;
const FETCHES: usize = 2;
const RETRIES: u32 = 3;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Kind {
    Published,
    Draft,
    /// A release version, by index into the interned release names.
    Version(u16),
}

struct Doc {
    kind: Kind,
    type_index: u16,
    /// The warm-up pass of its type that last saw the document.
    pass: u16,
    created: u32,
    updated: u32,
    /// Length of the JSON text.
    len: u32,
    /// Whether `body` was compressed with its type's dictionary.
    dict: bool,
    /// The preview title in lower case, for sorting and searching.
    title: Option<Box<str>>,
    /// The JSON text, lz4 compressed; `None` for a document too large for the warm-up or evicted.
    body: Option<Box<[u8]>>,
}

struct Group {
    docs: Vec<Doc>,
    type_index: u16,
    /// Every document of the group is known: its type was warmed, or the group was fetched.
    known: bool,
    last_used: u32,
}

impl Group {
    fn complete(&self) -> bool {
        self.known && self.docs.iter().all(|doc| doc.body.is_some())
    }

    fn get(&self, kind: Kind) -> Option<&Doc> {
        self.docs.iter().find(|doc| doc.kind == kind)
    }

    /// The document `perspective` shows, like the list query: a release version over the draft
    /// over the published document.
    fn shown(&self, view: View) -> Option<&Doc> {
        match view {
            View::Published => self.get(Kind::Published),
            View::Drafts => self.get(Kind::Draft).or_else(|| self.get(Kind::Published)),
            View::Release(release) => release
                .and_then(|release| self.get(Kind::Version(release)))
                .or_else(|| self.get(Kind::Draft))
                .or_else(|| self.get(Kind::Published)),
        }
    }
}

/// A perspective with its release name interned; `Release(None)` is a release without versions.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum View {
    Published,
    Drafts,
    Release(Option<u16>),
}

struct TypeState {
    name: Box<str>,
    title_field: Option<String>,
    dictionary: Option<Box<[u8]>>,
    /// The whole type was fetched once, so its index is complete.
    complete: bool,
    skipped: bool,
    pass: u16,
}

#[derive(Default)]
struct Inner {
    types: Vec<TypeState>,
    type_index: HashMap<String, u16>,
    releases: Vec<Box<str>>,
    release_index: HashMap<Box<str>, u16>,
    groups: HashMap<Arc<str>, Group>,
    /// Listener events received, and the latest per document, so a page fetched before an event
    /// does not overwrite what the event brought.
    seq: u64,
    touched: HashMap<Box<str>, u64>,
    bytes: usize,
    json_bytes: usize,
    bodies: usize,
    clock: u32,
    evictions: usize,
}

/// Heap bytes of a document beyond its slot in the group, as the allocator rounds them.
fn doc_heap(doc: &Doc) -> usize {
    let alloc = |len: usize| if len == 0 { 0 } else { (len + 4).next_multiple_of(8) };
    doc.title.as_ref().map_or(0, |title| alloc(title.len())) + doc.body.as_ref().map_or(0, |body| alloc(body.len()))
}

fn doc_cost(doc: &Doc) -> usize {
    size_of::<Doc>() + doc_heap(doc)
}

fn group_cost(id: &str) -> usize {
    // The map slot (at its 7/8 load factor) and the key's allocation.
    (size_of::<(Arc<str>, Group)>() + 1) * 8 / 7 + (id.len() + 2 * size_of::<usize>() + 4).next_multiple_of(8)
}

/// Seconds since the epoch for the timestamps Content Lake writes, `2024-05-01T10:00:00Z`
/// (with or without fractional seconds).
fn parse_iso(text: &str) -> Option<u32> {
    let bytes = text.as_bytes();
    if bytes.len() < 20 || bytes[4] != b'-' || bytes[7] != b'-' || bytes[10] != b'T' {
        return None;
    }
    let number = |range: std::ops::Range<usize>| text.get(range)?.parse::<i64>().ok();
    let (year, month, day) = (number(0..4)?, number(5..7)?, number(8..10)?);
    let (hour, minute, second) = (number(11..13)?, number(14..16)?, number(17..19)?);
    // Days from civil, after Howard Hinnant's algorithm.
    let y = if month <= 2 { year - 1 } else { year };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let mp = (month + 9) % 12;
    let doy = (153 * mp + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146_097 + doe - 719_468;
    u32::try_from(days * 86_400 + hour * 3600 + minute * 60 + second).ok()
}

/// A list search like `<title> match "<search>*"`: every word matches a word of the title, the
/// last one as a prefix.
struct Search {
    words: Vec<String>,
}

fn words(text: &str) -> impl Iterator<Item = &str> {
    text.split(|c: char| !c.is_alphanumeric()).filter(|word| !word.is_empty())
}

impl Search {
    fn new(text: &str) -> Search {
        Search { words: words(&text.to_lowercase()).map(str::to_owned).collect() }
    }

    fn matches(&self, title: &str) -> bool {
        let last = self.words.len().saturating_sub(1);
        self.words.iter().enumerate().all(|(index, word)| {
            words(title)
                .any(|candidate| if index == last { candidate.starts_with(word.as_str()) } else { candidate == word })
        })
    }
}

impl Inner {
    fn intern_release(&mut self, name: &str) -> u16 {
        if let Some(index) = self.release_index.get(name) {
            return *index;
        }
        let index = self.releases.len() as u16;
        self.releases.push(name.into());
        self.release_index.insert(name.into(), index);
        index
    }

    /// The group id and kind of a raw document id.
    fn parse_id<'a>(&mut self, id: &'a str) -> (&'a str, Kind) {
        if let Some(published) = id.strip_prefix("drafts.") {
            return (published, Kind::Draft);
        }
        if let Some((release, published)) = id.strip_prefix("versions.").and_then(|rest| rest.split_once('.')) {
            return (published, Kind::Version(self.intern_release(release)));
        }
        (id, Kind::Published)
    }

    fn raw_id(&self, published: &str, kind: Kind) -> String {
        match kind {
            Kind::Published => published.to_owned(),
            Kind::Draft => format!("drafts.{published}"),
            Kind::Version(release) => format!("versions.{}.{published}", self.releases[release as usize]),
        }
    }

    fn view(&self, perspective: &Perspective) -> View {
        match perspective {
            Perspective::Published => View::Published,
            Perspective::Drafts => View::Drafts,
            Perspective::Release(name) => View::Release(self.release_index.get(name.as_str()).copied()),
        }
    }

    fn compress(&self, type_index: u16, text: &str) -> (Box<[u8]>, bool) {
        match &self.types[type_index as usize].dictionary {
            Some(dictionary) => (lz4_flex::block::compress_with_dict(text.as_bytes(), dictionary).into(), true),
            None => (lz4_flex::block::compress(text.as_bytes()).into(), false),
        }
    }

    fn text(&self, doc: &Doc) -> Option<String> {
        let body = doc.body.as_ref()?;
        let len = doc.len as usize;
        let bytes = match (&self.types[doc.type_index as usize].dictionary, doc.dict) {
            (Some(dictionary), true) => lz4_flex::block::decompress_with_dict(body, len, dictionary).ok()?,
            _ => lz4_flex::block::decompress(body, len).ok()?,
        };
        String::from_utf8(bytes).ok()
    }

    fn value(&self, doc: &Doc) -> Option<Value> {
        serde_json::from_str(&self.text(doc)?).ok()
    }

    /// Makes the dictionary of a type from the first documents fetched of it.
    fn make_dictionary(&mut self, type_index: u16, texts: &[&str]) {
        let state = &mut self.types[type_index as usize];
        if state.dictionary.is_some() || texts.len() < 8 {
            return;
        }
        let mut dictionary = Vec::with_capacity(DICTIONARY_BYTES);
        for text in texts {
            if dictionary.len() + text.len() > DICTIONARY_BYTES {
                break;
            }
            dictionary.extend_from_slice(text.as_bytes());
        }
        self.bytes += dictionary.len();
        state.dictionary = Some(dictionary.into());
    }

    /// The fields `insert` reads from a document's JSON, without parsing the rest of it: the
    /// documents too large to keep are parsed only this far.
    fn fields(&self, text: &str) -> Option<Value> {
        let Ok(top) = serde_json::from_str::<HashMap<&str, &RawValue>>(text) else {
            // A key with an escape sequence cannot be borrowed.
            return serde_json::from_str(text).ok();
        };
        let parse = |key: &str| top.get(key).and_then(|raw| serde_json::from_str::<Value>(raw.get()).ok());
        let title = parse("_type")
            .and_then(|name| self.type_index.get(name.as_str()?).copied())
            .and_then(|index| self.types[index as usize].title_field.clone());
        let fields = ["_id", "_type", "_createdAt", "_updatedAt"].into_iter().chain(title.as_deref());
        Some(Value::Object(fields.filter_map(|key| Some((key.to_owned(), parse(key)?))).collect()))
    }

    /// Stores a document; `keep` is false for one too large to keep the text of. Returns its type,
    /// and whether what lists sort and filter on changed.
    fn insert(&mut self, id: &str, text: &str, doc: &Value, keep: bool) -> Option<(u16, bool)> {
        let type_index = *self.type_index.get(doc.get("_type")?.as_str()?)?;
        let (published, kind) = self.parse_id(id);
        let state = &self.types[type_index as usize];
        let title = state
            .title_field
            .as_ref()
            .and_then(|field| doc.get(field))
            .and_then(preview_text)
            .map(|title| title.to_lowercase().into_boxed_str());
        let time = |key: &str| doc.get(key).and_then(Value::as_str).and_then(parse_iso).unwrap_or(0);
        let (body, dict) = match keep {
            true => {
                let (body, dict) = self.compress(type_index, text);
                (Some(body), dict)
            }
            false => (None, false),
        };
        let new = Doc {
            kind,
            type_index,
            pass: state.pass,
            created: time("_createdAt"),
            updated: time("_updatedAt"),
            len: text.len() as u32,
            dict,
            title,
            body,
        };
        let known = state.complete;
        let mut added = doc_cost(&new);
        if new.body.is_some() {
            self.bodies += 1;
            self.json_bytes += text.len();
        }
        if !self.groups.contains_key(published) {
            added += group_cost(published);
            self.groups.insert(published.into(), Group { docs: Vec::new(), type_index, known, last_used: 0 });
        }
        let group = self.groups.get_mut(published).expect("inserted above");
        group.type_index = type_index;
        let mut removed = 0;
        let listed = match group.docs.iter_mut().find(|doc| doc.kind == kind) {
            Some(existing) => {
                removed = doc_cost(existing);
                if existing.body.is_some() {
                    self.bodies -= 1;
                    self.json_bytes -= existing.len as usize;
                }
                let listed =
                    existing.title != new.title || existing.updated != new.updated || existing.created != new.created;
                *existing = new;
                listed
            }
            None => {
                group.docs.push(new);
                true
            }
        };
        self.bytes = self.bytes + added - removed;
        Some((type_index, listed))
    }

    fn remove(&mut self, id: &str) -> Option<u16> {
        let (published, kind) = self.parse_id(id);
        let group = self.groups.get_mut(published)?;
        let position = group.docs.iter().position(|doc| doc.kind == kind)?;
        let doc = group.docs.swap_remove(position);
        self.bytes -= doc_cost(&doc);
        if doc.body.is_some() {
            self.bodies -= 1;
            self.json_bytes -= doc.len as usize;
        }
        Some(group.type_index)
    }

    /// Marks a type warmed, after a pass that fetched all of it: every group is known, and
    /// documents the pass did not see (deleted while the replica was not listening) go.
    fn complete_type(&mut self, type_index: u16, pass: u16, since: u64) {
        self.types[type_index as usize].complete = true;
        let mut stale = Vec::new();
        for (published, group) in &mut self.groups {
            if group.type_index != type_index {
                continue;
            }
            group.known = true;
            for doc in &group.docs {
                if doc.pass < pass {
                    stale.push((published.clone(), doc.kind));
                }
            }
        }
        for (published, kind) in stale {
            let id = self.raw_id(&published, kind);
            if self.touched.get(id.as_str()).is_none_or(|seq| *seq <= since) {
                self.remove(&id);
            }
        }
    }

    /// Drops the texts of the least recently shown groups until the replica fits `budget`, and
    /// returns their types.
    fn evict(&mut self, budget: usize) -> Vec<u16> {
        let mut types = Vec::new();
        if self.bytes <= budget {
            return types;
        }
        let mut candidates: Vec<(u32, Arc<str>)> = self
            .groups
            .iter()
            .filter(|(_, group)| group.docs.iter().any(|doc| doc.body.is_some()))
            .map(|(id, group)| (group.last_used, id.clone()))
            .collect();
        candidates.sort_unstable_by_key(|(used, _)| *used);
        for (_, id) in candidates {
            if self.bytes <= budget {
                break;
            }
            let Some(group) = self.groups.get_mut(&id) else { continue };
            types.push(group.type_index);
            for doc in &mut group.docs {
                if let Some(body) = doc.body.take() {
                    let alloc = (body.len() + 4).next_multiple_of(8);
                    self.bytes -= alloc;
                    self.bodies -= 1;
                    self.json_bytes -= doc.len as usize;
                }
            }
            self.evictions += 1;
        }
        types.sort_unstable();
        types.dedup();
        types
    }

    /// The published ids of a warmed type's documents as `perspective` lists them.
    fn list(&self, type_index: u16, view: View, ordering: Ordering, search: &str) -> Vec<Arc<str>> {
        let search = Search::new(search);
        let by_title = self.types[type_index as usize].title_field.is_some();
        let mut rows: Vec<(&Arc<str>, &Doc)> = self
            .groups
            .iter()
            .filter(|(_, group)| group.type_index == type_index)
            .filter_map(|(id, group)| Some((id, group.shown(view)?)))
            .filter(|(id, doc)| {
                search.words.is_empty()
                    || match by_title {
                        true => doc.title.as_deref().is_some_and(|title| search.matches(title)),
                        false => search.matches(&id.to_lowercase()),
                    }
            })
            .collect();
        match ordering {
            Ordering::UpdatedAt => rows.sort_unstable_by(|a, b| b.1.updated.cmp(&a.1.updated).then(a.0.cmp(b.0))),
            Ordering::CreatedAt => rows.sort_unstable_by(|a, b| b.1.created.cmp(&a.1.created).then(a.0.cmp(b.0))),
            Ordering::Title => rows.sort_unstable_by(|a, b| {
                // Like GROQ, documents without a title sort after the rest.
                match (a.1.title.as_deref(), b.1.title.as_deref()) {
                    (Some(x), Some(y)) => x.cmp(y),
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => std::cmp::Ordering::Equal,
                }
                .then(a.0.cmp(b.0))
            }),
        }
        rows.into_iter().map(|(id, _)| id.clone()).collect()
    }
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Status {
    /// Documents whose text the replica holds.
    pub docs: usize,
    pub groups: usize,
    /// Estimated heap bytes of the replica, compressed texts and index.
    pub bytes: usize,
    /// Uncompressed size of the texts held.
    pub json_bytes: usize,
    pub budget: usize,
    pub types_done: usize,
    pub types: usize,
    pub warming: bool,
    /// When the warm-up finished, in ms since navigation start, and how long it took.
    pub warmed: Option<(f64, f64)>,
    /// The warm-up stopped because the next page would not fit the budget.
    pub full: bool,
    pub evictions: usize,
    pub fetched: usize,
}

/// A cached group: the published document and the draft (`None` when missing) and every
/// release version, by raw id, and the ids of the versions.
pub struct Seed {
    pub docs: Vec<(String, Option<Value>)>,
    pub versions: Vec<String>,
}

#[derive(Deserialize)]
struct Page<'a> {
    #[serde(borrow)]
    result: Vec<&'a RawValue>,
}

pub struct Replica {
    inner: RefCell<Inner>,
    client: RefCell<Option<Client>>,
    listener: RefCell<Option<Listener>>,
    /// Per type: changes of what lists sort and filter on, and of anything a row shows.
    lists: RefCell<Vec<ArcRwSignal<u64>>>,
    rows: RefCell<Vec<ArcRwSignal<u64>>>,
    queue: RefCell<VecDeque<u16>>,
    workers: Cell<usize>,
    started: Cell<f64>,
    full: Cell<bool>,
    /// Groups rows show a skeleton for, with how many rows do.
    wanted: RefCell<HashMap<Arc<str>, usize>>,
    pending: RefCell<Vec<Arc<str>>>,
    in_flight: RefCell<Vec<Arc<str>>>,
    fetches: Cell<usize>,
    fetched: Cell<usize>,
    budget: usize,
    pub status: ArcRwSignal<Status>,
}

/// The cache budget in bytes: `?cache=<MiB>` in the URL, or the default.
pub fn budget_from_url() -> usize {
    let mib = web_sys::window()
        .and_then(|window| window.location().search().ok())
        .and_then(|search| web_sys::UrlSearchParams::new_with_str(&search).ok())
        .and_then(|params| params.get("cache"))
        .and_then(|value| value.parse::<f64>().ok())
        .filter(|mib| *mib >= 0.0)
        .unwrap_or(DEFAULT_BUDGET_MIB);
    (mib * 1024.0 * 1024.0) as usize
}

/// Sets `window.__studioCache`, which the JS-lite studio sets the same way, for benchmarks.
fn publish_status(status: &Status) {
    let Some(window) = web_sys::window() else { return };
    let value = json!({
        "docs": status.docs,
        "groups": status.groups,
        "bytes": status.bytes,
        "jsonBytes": status.json_bytes,
        "budget": status.budget,
        "typesDone": status.types_done,
        "types": status.types,
        "warming": status.warming,
        "warmedAt": status.warmed.map(|(at, _)| at),
        "warmedIn": status.warmed.map(|(_, took)| took),
        "full": status.full,
        "evictions": status.evictions,
        "fetched": status.fetched,
        "wasmMemory": wasm_memory(),
    });
    if let Ok(value) = js_sys::JSON::parse(&value.to_string()) {
        let _ = js_sys::Reflect::set(&window, &"__studioCache".into(), &value);
    }
}

thread_local! {
    static REPLICA: Rc<Replica> = Rc::new(Replica {
        inner: RefCell::default(),
        client: RefCell::new(None),
        listener: RefCell::new(None),
        lists: RefCell::new(Vec::new()),
        rows: RefCell::new(Vec::new()),
        queue: RefCell::new(VecDeque::new()),
        workers: Cell::new(0),
        started: Cell::new(0.0),
        full: Cell::new(false),
        wanted: RefCell::default(),
        pending: RefCell::default(),
        in_flight: RefCell::default(),
        fetches: Cell::new(0),
        fetched: Cell::new(0),
        budget: budget_from_url(),
        status: ArcRwSignal::new(Status::default()),
    });
}

pub fn replica() -> Rc<Replica> {
    REPLICA.with(Rc::clone)
}

impl Replica {
    /// Opens the listener for every document type of the schema and warms up once it is open.
    pub fn start(&self, client: Client) {
        if self.client.borrow().is_some() {
            return;
        }
        let schema = schema::current();
        let names: Vec<String> = schema.document_types().iter().map(|def| def.name.clone()).collect();
        {
            let mut inner = self.inner.borrow_mut();
            for name in &names {
                let index = inner.types.len() as u16;
                inner.type_index.insert(name.clone(), index);
                inner.types.push(TypeState {
                    name: name.as_str().into(),
                    title_field: schema.preview(name).title,
                    dictionary: None,
                    complete: false,
                    skipped: false,
                    pass: 0,
                });
            }
        }
        *self.lists.borrow_mut() = names.iter().map(|_| ArcRwSignal::new(0)).collect();
        *self.rows.borrow_mut() = names.iter().map(|_| ArcRwSignal::new(0)).collect();
        *self.queue.borrow_mut() = (0..names.len() as u16).collect();
        *self.client.borrow_mut() = Some(client.clone());
        self.started.set(now_ms());
        let params = Map::from_iter([("types".to_owned(), json!(names))]);
        let options =
            ListenOptions { include_result: true, include_all_versions: true, tag: "replica.listener".into() };
        let listener = client.listen("*[_type in $types]", params, options, |event| replica().on_event(event));
        *self.listener.borrow_mut() = Some(listener);
        self.update_status();
    }

    fn client(&self) -> Client {
        self.client.borrow().clone().expect("the replica starts with a client")
    }

    fn type_of(&self, name: &str) -> Option<u16> {
        self.inner.borrow().type_index.get(name).copied()
    }

    fn track(signals: &RefCell<Vec<ArcRwSignal<u64>>>, type_index: u16) {
        if let Some(signal) = signals.borrow().get(type_index as usize) {
            signal.track();
        }
    }

    fn notify(signals: &RefCell<Vec<ArcRwSignal<u64>>>, type_index: u16) {
        let signal = signals.borrow().get(type_index as usize).cloned();
        if let Some(signal) = signal {
            signal.update(|version| *version += 1);
        }
    }

    /// Re-renders the lists of a type, and its rows.
    fn bump(&self, type_index: u16) {
        Self::notify(&self.lists, type_index);
        Self::notify(&self.rows, type_index);
    }

    fn bump_rows(&self, type_index: u16) {
        Self::notify(&self.rows, type_index);
    }

    fn update_status(&self) {
        let inner = self.inner.borrow();
        let warming = self.workers.get() > 0;
        let previous = self.status.get_untracked();
        let warmed = previous.warmed.or_else(|| {
            (!warming && self.queue.borrow().is_empty() && inner.types.iter().any(|state| state.pass > 0)).then(|| {
                let now = now_ms();
                (now, now - self.started.get())
            })
        });
        let status = Status {
            docs: inner.bodies,
            groups: inner.groups.len(),
            bytes: inner.bytes,
            json_bytes: inner.json_bytes,
            budget: self.budget,
            types_done: inner.types.iter().filter(|state| state.complete || state.skipped).count(),
            types: inner.types.len(),
            warming,
            warmed,
            full: self.full.get(),
            evictions: inner.evictions,
            fetched: self.fetched.get(),
        };
        drop(inner);
        if status != previous {
            publish_status(&status);
            self.status.set(status);
        }
    }

    fn on_event(&self, event: ListenEvent) {
        match event {
            ListenEvent::Welcome { reconnected: false } => self.spawn_workers(),
            ListenEvent::Welcome { reconnected: true } => {
                // Events may have been missed: warm every type again, keeping what is cached.
                let count = self.inner.borrow().types.len() as u16;
                *self.queue.borrow_mut() = (0..count).collect();
                self.full.set(false);
                self.spawn_workers();
            }
            ListenEvent::Mutation(event) => {
                let type_index = {
                    let mut inner = self.inner.borrow_mut();
                    inner.seq += 1;
                    let seq = inner.seq;
                    inner.touched.insert(event.document_id.as_str().into(), seq);
                    match &event.result {
                        Some(doc) => {
                            let text = doc.to_string();
                            inner.insert(&event.document_id, &text, doc, true).map(|(type_index, _)| type_index)
                        }
                        None => inner.remove(&event.document_id),
                    }
                };
                if let Some(type_index) = type_index {
                    let evicted = self.inner.borrow_mut().evict(self.budget);
                    self.bump(type_index);
                    for type_index in evicted {
                        self.bump_rows(type_index);
                    }
                    self.update_status();
                }
            }
            ListenEvent::Reconnecting | ListenEvent::Error(_) => {}
        }
    }

    /// Moves a type to the front of the warm-up, eg when a list of it opens.
    pub fn prioritize(&self, type_name: &str) {
        let Some(type_index) = self.type_of(type_name) else { return };
        let mut queue = self.queue.borrow_mut();
        if let Some(position) = queue.iter().position(|index| *index == type_index) {
            queue.remove(position);
            queue.push_front(type_index);
        }
    }

    fn spawn_workers(&self) {
        while self.workers.get() < WARM_WORKERS && !self.queue.borrow().is_empty() {
            self.workers.set(self.workers.get() + 1);
            spawn_local(warm_worker());
        }
        self.update_status();
    }

    /// Whether `count` more documents of a type fit the budget, estimated from what the cached
    /// ones take per byte of JSON, and from the type's average size once some are fetched.
    fn would_fit(&self, count: usize, average_json: Option<usize>) -> bool {
        let inner = self.inner.borrow();
        let per_doc = match (inner.bodies, average_json) {
            (0, _) => 512,
            (_, Some(json)) => (json as f64 * inner.bytes as f64 / inner.json_bytes.max(1) as f64) as usize,
            (bodies, None) => inner.bytes / bodies,
        };
        inner.bytes + count * per_doc <= self.budget
    }

    /// The preview of a cached group of any type in the drafts perspective, for references:
    /// `Some(None)` when the group is known not to exist.
    pub fn reference_preview(&self, published: &str) -> Option<Option<DocPreview>> {
        let inner = self.inner.borrow();
        let group = inner.groups.get(published).filter(|group| group.complete())?;
        let Some(doc) = group.shown(View::Drafts) else { return Some(None) };
        let value = inner.value(doc)?;
        Some(Some(DocPreview::from_document(published, &value, doc.kind != Kind::Published)))
    }

    /// The row preview of a cached group as `perspective` shows it, tracked by its type.
    pub fn preview(&self, type_name: &str, published: &str, perspective: &Perspective) -> Option<DocPreview> {
        if let Some(type_index) = self.type_of(type_name) {
            Self::track(&self.rows, type_index);
        }
        let value = {
            let mut inner = self.inner.borrow_mut();
            inner.clock += 1;
            let clock = inner.clock;
            let view = inner.view(perspective);
            let group = inner.groups.get_mut(published).filter(|group| group.complete())?;
            group.last_used = clock;
            let inner = &*inner;
            let doc = inner.groups.get(published)?.shown(view)?;
            (inner.value(doc)?, doc.kind != Kind::Published)
        };
        Some(DocPreview::from_document(published, &value.0, value.1))
    }

    /// The documents of a cached group, for the document store to start from.
    pub fn pair(&self, published: &str) -> Option<Seed> {
        let mut inner = self.inner.borrow_mut();
        inner.clock += 1;
        let clock = inner.clock;
        let group = inner.groups.get_mut(published).filter(|group| group.complete())?;
        group.last_used = clock;
        let inner = &*inner;
        let group = inner.groups.get(published)?;
        let mut docs = Vec::with_capacity(group.docs.len() + 2);
        let mut versions = Vec::new();
        for kind in [Kind::Published, Kind::Draft] {
            let doc = match group.get(kind) {
                Some(doc) => Some(inner.value(doc)?),
                None => None,
            };
            docs.push((inner.raw_id(published, kind), doc));
        }
        for doc in group.docs.iter().filter(|doc| matches!(doc.kind, Kind::Version(_))) {
            let id = inner.raw_id(published, doc.kind);
            docs.push((id.clone(), Some(inner.value(doc)?)));
            versions.push(id);
        }
        Some(Seed { docs, versions })
    }

    /// The published ids of a type's documents as `perspective` lists them, tracked, once the
    /// type is warmed; `None` before.
    pub fn list(
        &self,
        type_name: &str,
        perspective: &Perspective,
        ordering: Ordering,
        search: &str,
    ) -> Option<Arc<Vec<Option<Arc<str>>>>> {
        let type_index = self.type_of(type_name)?;
        Self::track(&self.lists, type_index);
        let inner = self.inner.borrow();
        if !inner.types[type_index as usize].complete {
            return None;
        }
        let view = inner.view(perspective);
        Some(Arc::new(inner.list(type_index, view, ordering, search).into_iter().map(Some).collect()))
    }

    /// Asks for the documents of a group a row shows a skeleton for, until `unwant`.
    pub fn want(&self, published: Arc<str>) {
        let first = {
            let mut wanted = self.wanted.borrow_mut();
            let count = wanted.entry(published.clone()).or_insert(0);
            *count += 1;
            *count == 1
        };
        if first {
            self.pending.borrow_mut().push(published);
            self.pump();
        }
    }

    pub fn unwant(&self, published: &str) {
        let mut wanted = self.wanted.borrow_mut();
        if let Some(count) = wanted.get_mut(published) {
            *count -= 1;
            if *count == 0 {
                wanted.remove(published);
            }
        }
    }

    /// Starts on-demand fetches while there is room, the most recently wanted groups first, so
    /// rows that scrolled by are skipped.
    fn pump(&self) {
        while self.fetches.get() < FETCHES {
            let batch: Vec<Arc<str>> = {
                let mut pending = self.pending.borrow_mut();
                let wanted = self.wanted.borrow();
                let in_flight = self.in_flight.borrow();
                pending.retain(|id| wanted.contains_key(id) && !in_flight.contains(id));
                let start = pending.len().saturating_sub(FETCH_BATCH);
                pending.drain(start..).rev().collect()
            };
            if batch.is_empty() {
                return;
            }
            self.in_flight.borrow_mut().extend(batch.iter().cloned());
            self.fetches.set(self.fetches.get() + 1);
            spawn_local(fetch_groups(batch));
        }
    }
}

async fn query_page(groq: &str, params: &Map<String, Value>, tag: &str) -> Option<String> {
    let mut attempt = 0;
    loop {
        match replica().client().query_text("raw", groq, params, tag).await {
            Ok(text) => return Some(text),
            Err(_) if attempt < RETRIES => {
                sleep(1000 << attempt).await;
                attempt += 1;
            }
            Err(_) => return None,
        }
    }
}

/// A page of the warm-up, with the documents too large to keep cut down to the fields `insert`
/// reads.
async fn query_documents(groq: &str, params: &Map<String, Value>, fields: &[&str]) -> Option<Vec<QueriedDocument>> {
    let mut attempt = 0;
    loop {
        match replica().client().query_documents("raw", groq, params, "replica.warm", DOC_LIMIT, fields).await {
            Ok(docs) => return Some(docs),
            Err(_) if attempt < RETRIES => {
                sleep(1000 << attempt).await;
                attempt += 1;
            }
            Err(_) => return None,
        }
    }
}

async fn warm_worker() {
    loop {
        let replica = replica();
        let next = replica.queue.borrow_mut().pop_front();
        let Some(type_index) = next else { break };
        if replica.full.get() {
            break;
        }
        warm_type(type_index).await;
    }
    let replica = replica();
    replica.workers.set(replica.workers.get() - 1);
    replica.update_status();
}

/// Fetches every document of a type in pages ordered by id, small at first so a type of large
/// documents is noticed early, then sized to about `PAGE_BYTES`.
async fn warm_type(type_index: u16) {
    let replica = replica();
    let (name, title, pass, since) = {
        let mut inner = replica.inner.borrow_mut();
        let state = &mut inner.types[type_index as usize];
        state.pass += 1;
        state.skipped = false;
        (state.name.to_string(), state.title_field.clone(), state.pass, inner.seq)
    };
    let fields: Vec<&str> = ["_id", "_type", "_createdAt", "_updatedAt"].into_iter().chain(title.as_deref()).collect();
    let mut after = String::new();
    let mut size = FIRST_PAGE;
    // Only the documents small enough to keep count towards the average, so one huge document
    // neither skips a type of small ones nor shrinks its pages.
    let (mut seen, mut kept, mut kept_bytes) = (0usize, 0usize, 0usize);
    loop {
        if !replica.would_fit(size, (kept > 0).then(|| kept_bytes / kept)) {
            replica.full.set(true);
            replica.queue.borrow_mut().clear();
            replica.update_status();
            return;
        }
        let groq = format!("*[_type == $type && _id > $after] | order(_id) [0...{size}]");
        let params = Map::from_iter([("type".to_owned(), json!(name)), ("after".to_owned(), json!(after))]);
        let Some(page) = query_documents(&groq, &params, &fields).await else { return };
        let count = page.len();
        {
            let mut inner = replica.inner.borrow_mut();
            let texts: Vec<&str> = page.iter().filter(|doc| doc.whole).map(|doc| doc.json.as_str()).collect();
            inner.make_dictionary(type_index, &texts);
            for queried in &page {
                seen += 1;
                if queried.whole {
                    kept += 1;
                    kept_bytes += queried.len;
                }
                let Some(doc) = inner.fields(&queried.json) else { continue };
                let Some(id) = doc.get("_id").and_then(Value::as_str) else { continue };
                after = id.to_owned();
                if inner.touched.get(id).is_some_and(|seq| *seq > since) {
                    continue;
                }
                inner.insert(id, &queried.json, &doc, queried.whole);
            }
            if count < size {
                inner.complete_type(type_index, pass, since);
            } else if seen >= FIRST_PAGE && (kept == 0 || kept_bytes / kept > TYPE_AVERAGE_LIMIT) {
                inner.types[type_index as usize].skipped = true;
            }
        }
        replica.bump(type_index);
        replica.update_status();
        let state = {
            let inner = replica.inner.borrow();
            let state = &inner.types[type_index as usize];
            (state.complete && state.pass == pass) || state.skipped
        };
        if count < size || state {
            return;
        }
        let average = kept_bytes.checked_div(kept).unwrap_or(DOC_LIMIT).max(1);
        size = (PAGE_BYTES / average).clamp(size, size * 4);
    }
}

/// Fetches every document of each group in `ids` (published, draft and versions).
async fn fetch_groups(ids: Vec<Arc<str>>) {
    let replica = replica();
    let since = replica.inner.borrow().seq;
    let filter: Vec<String> = (0..ids.len()).map(|index| format!("sanity::versionOf($id{index})")).collect();
    let groq = format!("*[{}]", filter.join(" || "));
    let params: Map<String, Value> =
        ids.iter().enumerate().map(|(index, id)| (format!("id{index}"), json!(id.as_ref()))).collect();
    let text = query_page(&groq, &params, "replica.fetch").await;
    let mut types = Vec::new();
    if let Some(page) = text.as_deref().and_then(|text| serde_json::from_str::<Page>(text).ok()) {
        let mut inner = replica.inner.borrow_mut();
        for raw in &page.result {
            let text = raw.get();
            let Some(doc) = inner.fields(text) else { continue };
            let Some(id) = doc.get("_id").and_then(Value::as_str) else { continue };
            if inner.touched.get(id).is_some_and(|seq| *seq > since) {
                continue;
            }
            types.extend(inner.insert(id, text, &doc, true));
        }
        for id in &ids {
            // The rows that asked for the groups show them now, so they are the last to evict.
            inner.clock += 1;
            let clock = inner.clock;
            match inner.groups.get_mut(id) {
                Some(group) => {
                    group.known = true;
                    group.last_used = clock;
                    types.push((group.type_index, false));
                }
                None => {
                    let cost = group_cost(id);
                    inner.groups.insert(
                        id.clone(),
                        Group { docs: Vec::new(), type_index: u16::MAX, known: true, last_used: clock },
                    );
                    inner.bytes += cost;
                }
            }
        }
        types.extend(inner.evict(replica.budget).into_iter().map(|type_index| (type_index, false)));
        replica.fetched.set(replica.fetched.get() + ids.len());
    } else {
        // Asked for again by the rows that still show them.
        replica.pending.borrow_mut().extend(ids.iter().cloned());
    }
    replica.in_flight.borrow_mut().retain(|id| !ids.contains(id));
    types.sort_unstable();
    types.dedup();
    for (type_index, listed) in types {
        match listed {
            true => replica.bump(type_index),
            false => replica.bump_rows(type_index),
        }
    }
    replica.fetches.set(replica.fetches.get() - 1);
    replica.update_status();
    if text.is_none() {
        sleep(1000).await;
    }
    replica.pump();
}

#[cfg(test)]
mod tests {
    use super::*;

    fn inner() -> Inner {
        let mut inner = Inner::default();
        for (name, title) in [("author", Some("name")), ("book", None)] {
            let index = inner.types.len() as u16;
            inner.type_index.insert(name.into(), index);
            inner.types.push(TypeState {
                name: name.into(),
                title_field: title.map(str::to_owned),
                dictionary: None,
                complete: false,
                skipped: false,
                pass: 1,
            });
        }
        inner
    }

    fn put(inner: &mut Inner, doc: Value) {
        let text = doc.to_string();
        let id = doc["_id"].as_str().unwrap().to_owned();
        inner.insert(&id, &text, &doc, true);
    }

    #[test]
    fn parses_timestamps() {
        assert_eq!(parse_iso("1970-01-01T00:00:00Z"), Some(0));
        assert_eq!(parse_iso("2024-05-01T10:00:00Z"), Some(1_714_557_600));
        assert_eq!(parse_iso("2024-05-01T10:00:00.123Z"), Some(1_714_557_600));
        assert_eq!(parse_iso("yesterday"), None);
    }

    #[test]
    fn searches_like_groq_match() {
        let search = Search::new("ada lov");
        assert!(search.matches("ada lovelace"));
        assert!(!search.matches("adam lovelace"));
        assert!(Search::new("Lov").matches("ada lovelace"));
        assert!(!Search::new("ace").matches("ada lovelace"));
    }

    #[test]
    fn round_trips_documents_with_a_dictionary() {
        let mut inner = inner();
        let docs: Vec<Value> = (0..10)
            .map(|index| json!({"_id": format!("a{index}"), "_type": "author", "name": format!("Author {index}"), "bio": "Lorem ipsum dolor sit amet"}))
            .collect();
        let texts: Vec<String> = docs.iter().map(Value::to_string).collect();
        let refs: Vec<&str> = texts.iter().map(String::as_str).collect();
        inner.make_dictionary(0, &refs);
        for doc in &docs {
            put(&mut inner, doc.clone());
        }
        let group = &inner.groups["a3"];
        let doc = group.get(Kind::Published).unwrap();
        assert!(doc.dict);
        assert_eq!(inner.value(doc).unwrap(), docs[3]);
        assert_eq!(inner.json_bytes, texts.iter().map(String::len).sum::<usize>());
    }

    #[test]
    fn lists_groups_as_the_perspective_shows_them() {
        let mut inner = inner();
        put(&mut inner, json!({"_id": "a", "_type": "author", "name": "Zed", "_updatedAt": "2024-01-01T00:00:00Z"}));
        put(
            &mut inner,
            json!({"_id": "drafts.a", "_type": "author", "name": "Ada", "_updatedAt": "2024-03-01T00:00:00Z"}),
        );
        put(&mut inner, json!({"_id": "b", "_type": "author", "name": "Bea", "_updatedAt": "2024-02-01T00:00:00Z"}));
        put(
            &mut inner,
            json!({"_id": "versions.r1.c", "_type": "author", "name": "Cy", "_updatedAt": "2024-04-01T00:00:00Z"}),
        );
        put(&mut inner, json!({"_id": "x", "_type": "book", "_updatedAt": "2024-05-01T00:00:00Z"}));
        let ids = |list: Vec<Arc<str>>| list.iter().map(|id| id.to_string()).collect::<Vec<_>>();
        assert_eq!(ids(inner.list(0, View::Drafts, Ordering::UpdatedAt, "")), ["a", "b"]);
        assert_eq!(ids(inner.list(0, View::Published, Ordering::Title, "")), ["b", "a"]);
        assert_eq!(ids(inner.list(0, View::Drafts, Ordering::Title, "")), ["a", "b"]);
        let release = inner.release_index.get("r1").copied();
        assert_eq!(ids(inner.list(0, View::Release(release), Ordering::UpdatedAt, "")), ["c", "a", "b"]);
        assert_eq!(ids(inner.list(0, View::Drafts, Ordering::UpdatedAt, "be")), ["b"]);
        assert_eq!(ids(inner.list(1, View::Drafts, Ordering::UpdatedAt, "")), ["x"]);
    }

    #[test]
    fn completes_types_and_evicts_the_least_recently_used() {
        let mut inner = inner();
        put(&mut inner, json!({"_id": "a", "_type": "author", "name": "A"}));
        put(&mut inner, json!({"_id": "b", "_type": "author", "name": "B"}));
        assert!(!inner.groups["a"].complete());
        inner.types[0].pass = 2;
        put(&mut inner, json!({"_id": "a", "_type": "author", "name": "A"}));
        inner.complete_type(0, 2, 0);
        // `b` was not seen by the pass, so it was deleted meanwhile.
        assert!(inner.groups["a"].complete());
        assert!(inner.groups["b"].docs.is_empty());
        put(&mut inner, json!({"_id": "c", "_type": "author", "name": "C"}));
        inner.groups.get_mut("c").unwrap().last_used = 5;
        let before = inner.bytes;
        inner.evict(before - 1);
        assert!(!inner.groups["a"].complete());
        assert!(inner.groups["c"].complete());
        assert_eq!(inner.evictions, 1);
    }
}
