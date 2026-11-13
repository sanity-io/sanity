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
use std::collections::{HashMap, HashSet, VecDeque};
use std::rc::Rc;
use std::sync::Arc;

use js_sys::Uint8Array;
use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{Client, ListenEvent, ListenOptions, Listener, QueriedDocument, sleep};
use serde::Deserialize;
use serde_json::value::RawValue;
use serde_json::{Map, Value, json};
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::Closure;

use crate::list::Ordering;
use crate::persist::{self, Db, Write};
use crate::previews::DocPreview;
use crate::releases::Perspective;
use crate::router::Route;
use crate::schema;
use crate::util::{now_ms, preview_text, slice_expired, wasm_memory, yield_to_main};

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
/// Revisions listed per revalidation query, and changed documents refetched per query.
const LIST_PAGE: usize = 10_000;
const REFETCH_BATCH: usize = 200;
/// Types holding fewer documents than this between them are revalidated by one listing, up to
/// this many types.
const BATCH_DOCS: usize = 5_000;
const BATCH_TYPES: usize = 64;
/// The fields `insert` reads, besides the type's title field.
const INDEX_FIELDS: [&str; 5] = ["_id", "_type", "_rev", "_createdAt", "_updatedAt"];
/// The version of the persisted records, bumped when their layout changes.
const FORMAT: u32 = 2;
/// The persisted replica keeps a type in records of about this many bytes, one transaction each.
/// A restore decodes a record without yielding, so it stays well under a frame on a slow device.
const CHUNK_BYTES: usize = 128 * 1024;
/// How long the persisted replica waits after a change before saving it, and after the warm-up.
const SAVE_AFTER_CHANGE_MS: u32 = 5000;
const SAVE_AFTER_WARM_MS: u32 = 1000;

/// FNV-1a: revisions only need telling apart, and 8 bytes per document is less than the
/// revision itself.
fn rev_hash(rev: &str) -> u64 {
    rev.bytes().fold(0xcbf2_9ce4_8422_2325, |hash, byte| (hash ^ u64::from(byte)).wrapping_mul(0x0100_0000_01b3))
}

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
    /// A hash of `_rev`, to tell whether a document restored from the persisted replica changed.
    rev: u64,
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
    /// False for a group restored from the persisted replica, until its type is revalidated or
    /// the group is fetched: rows show it as stale meanwhile.
    fresh: bool,
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
    /// What the replica holds of the type may be out of date (restored, or the listener
    /// reconnected): the next pass checks the revisions before fetching anything.
    revalidate: bool,
    /// Changed since the persisted replica last saved the type.
    dirty: bool,
    /// The generation of the type's persisted records; a save writes the next one.
    generation: u32,
}

/// The little-endian encoding of the persisted records.
#[derive(Default)]
struct Writer(Vec<u8>);

impl Writer {
    fn u8(&mut self, value: u8) {
        self.0.push(value);
    }

    fn u16(&mut self, value: u16) {
        self.0.extend_from_slice(&value.to_le_bytes());
    }

    fn u32(&mut self, value: u32) {
        self.0.extend_from_slice(&value.to_le_bytes());
    }

    fn u64(&mut self, value: u64) {
        self.0.extend_from_slice(&value.to_le_bytes());
    }

    fn str(&mut self, value: &str) {
        self.u16(value.len() as u16);
        self.0.extend_from_slice(value.as_bytes());
    }

    fn bytes(&mut self, value: Option<&[u8]>) {
        match value {
            Some(bytes) => {
                self.u32(bytes.len() as u32);
                self.0.extend_from_slice(bytes);
            }
            None => self.u32(u32::MAX),
        }
    }
}

struct Reader<'a> {
    bytes: &'a [u8],
}

impl<'a> Reader<'a> {
    fn take(&mut self, len: usize) -> Option<&'a [u8]> {
        let (taken, rest) = self.bytes.split_at_checked(len)?;
        self.bytes = rest;
        Some(taken)
    }

    fn array<const N: usize>(&mut self) -> Option<[u8; N]> {
        self.take(N)?.try_into().ok()
    }

    fn u8(&mut self) -> Option<u8> {
        Some(self.array::<1>()?[0])
    }

    fn u16(&mut self) -> Option<u16> {
        Some(u16::from_le_bytes(self.array()?))
    }

    fn u32(&mut self) -> Option<u32> {
        Some(u32::from_le_bytes(self.array()?))
    }

    fn u64(&mut self) -> Option<u64> {
        Some(u64::from_le_bytes(self.array()?))
    }

    fn str(&mut self) -> Option<&'a str> {
        let len = self.u16()? as usize;
        std::str::from_utf8(self.take(len)?).ok()
    }

    fn bytes(&mut self) -> Option<Option<&'a [u8]>> {
        match self.u32()? {
            u32::MAX => Some(None),
            len => Some(Some(self.take(len as usize)?)),
        }
    }
}

/// What the persisted record of a type holds besides its documents.
struct TypeRecord {
    generation: u32,
    chunks: u32,
    complete: bool,
    skipped: bool,
    title_field: Option<String>,
    dictionary: Option<Box<[u8]>>,
}

impl TypeRecord {
    fn encode(&self) -> Vec<u8> {
        let mut out = Writer::default();
        out.u32(self.generation);
        out.u32(self.chunks);
        out.u8(u8::from(self.complete));
        out.u8(u8::from(self.skipped));
        out.bytes(self.title_field.as_deref().map(str::as_bytes));
        out.bytes(self.dictionary.as_deref());
        out.0
    }

    fn decode(bytes: &[u8]) -> Option<TypeRecord> {
        let mut reader = Reader { bytes };
        Some(TypeRecord {
            generation: reader.u32()?,
            chunks: reader.u32()?,
            complete: reader.u8()? == 1,
            skipped: reader.u8()? == 1,
            title_field: reader.bytes()?.map(|field| String::from_utf8_lossy(field).into_owned()),
            dictionary: reader.bytes()?.map(Box::from),
        })
    }
}

fn type_key(name: &str) -> String {
    format!("m:{name}")
}

/// The keys of a type's documents start with `c:<type>:`, and those of one generation with
/// `c:<type>:<generation>:`.
fn chunk_prefix(name: &str, generation: Option<u32>) -> String {
    match generation {
        Some(generation) => format!("c:{name}:{generation}:"),
        None => format!("c:{name}:"),
    }
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
    /// Groups restored from the persisted replica that are not fresh yet.
    stale_groups: usize,
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

    /// Stores documents of a warm-up pass, making the type's dictionary from them first if it
    /// has none. Documents changed since the pass started are the listener's.
    fn store_warmed(&mut self, type_index: u16, docs: &mut Vec<(String, QueriedDocument)>, since: u64) {
        let texts: Vec<&str> = docs.iter().filter_map(|(_, doc)| doc.json.as_deref()).collect();
        self.make_dictionary(type_index, &texts);
        for (id, doc) in docs.drain(..) {
            if self.touched.get(id.as_str()).is_some_and(|seq| *seq > since) {
                continue;
            }
            let keep = doc.json.is_some();
            self.insert(&id, doc.json.as_deref().unwrap_or_default(), &Value::Object(doc.fields), keep);
        }
    }

    /// The fields `insert` reads from a document's JSON, without parsing the rest of it: the
    /// documents fetched on demand are parsed only this far.
    fn fields(&self, text: &str) -> Option<Value> {
        let Ok(top) = serde_json::from_str::<HashMap<&str, &RawValue>>(text) else {
            // A key with an escape sequence cannot be borrowed.
            return serde_json::from_str(text).ok();
        };
        let parse = |key: &str| top.get(key).and_then(|raw| serde_json::from_str::<Value>(raw.get()).ok());
        let title = parse("_type")
            .and_then(|name| self.type_index.get(name.as_str()?).copied())
            .and_then(|index| self.types[index as usize].title_field.clone());
        let fields = INDEX_FIELDS.into_iter().chain(title.as_deref());
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
            rev: doc.get("_rev").and_then(Value::as_str).map_or(0, rev_hash),
            dict,
            title,
            body,
        };
        let known = state.complete;
        // A document fetched again at the revision the replica holds, eg a stale row's, changes
        // nothing the persisted records hold, so they are not written again for it.
        let unchanged =
            self.groups.get(published).and_then(|group| group.docs.iter().find(|doc| doc.kind == kind)).is_some_and(
                |existing| {
                    existing.rev != 0
                        && existing.rev == new.rev
                        && existing.type_index == type_index
                        && existing.body.is_some() == new.body.is_some()
                },
            );
        if !unchanged {
            self.types[type_index as usize].dirty = true;
        }
        let mut added = doc_cost(&new);
        if new.body.is_some() {
            self.bodies += 1;
            self.json_bytes += text.len();
        }
        if !self.groups.contains_key(published) {
            added += group_cost(published);
            let group = Group { docs: Vec::new(), type_index, known, fresh: true, last_used: 0 };
            self.groups.insert(published.into(), group);
        }
        let group = self.groups.get_mut(published).expect("inserted above");
        group.type_index = type_index;
        let mut removed = 0;
        let listed = match group.docs.iter_mut().find(|doc| doc.kind == kind) {
            Some(existing) => {
                // The record of the type the document had holds it until that type saves again.
                if let Some(state) = self.types.get_mut(existing.type_index as usize).filter(|_| !unchanged) {
                    state.dirty = true;
                }
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
        let type_index = group.type_index;
        for index in [type_index, doc.type_index] {
            if let Some(state) = self.types.get_mut(index as usize) {
                state.dirty = true;
            }
        }
        Some(type_index)
    }

    /// Marks a type warmed, after a pass that fetched all of it: every group is known.
    fn complete_type(&mut self, type_index: u16, pass: u16, since: u64) {
        let state = &mut self.types[type_index as usize];
        state.dirty |= !state.complete;
        state.complete = true;
        state.revalidate = false;
        self.end_pass(type_index, pass, since);
    }

    /// Ends a pass that listed every document of a type: its groups are current, and the
    /// documents the pass did not see (deleted while the replica was not listening) go.
    fn end_pass(&mut self, type_index: u16, pass: u16, since: u64) {
        let complete = self.types[type_index as usize].complete;
        let mut stale = Vec::new();
        for (published, group) in &mut self.groups {
            if group.type_index == type_index {
                group.known |= complete;
                if !group.fresh {
                    group.fresh = true;
                    self.stale_groups -= 1;
                }
            }
            // Passes count per type, and a group's draft can be of another type than the rest.
            for doc in group.docs.iter().filter(|doc| doc.type_index == type_index) {
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

    /// Checks a document a revalidation pass listed against the cached one: marks it seen by the
    /// pass when its revision is unchanged, and returns whether to refetch it. That is when it
    /// changed, or when it is new and its type is held whole (`complete`) or its group is known
    /// whole. The new documents of a group known in part, eg the drafts and versions a warm-up
    /// stopped at the budget never reached, are left to the fetch of the group a row showing it
    /// makes anyway.
    fn check_listed(&mut self, id: &str, rev: &str, pass: u16, complete: bool) -> bool {
        let (published, kind) = self.parse_id(id);
        let Some(group) = self.groups.get_mut(published) else { return complete };
        match group.docs.iter_mut().find(|doc| doc.kind == kind) {
            Some(doc) if doc.rev == rev_hash(rev) => {
                doc.pass = pass;
                false
            }
            Some(_) => true,
            None => complete || group.known,
        }
    }

    fn set_fresh(&mut self, published: &str) {
        if let Some(group) = self.groups.get_mut(published).filter(|group| !group.fresh) {
            group.fresh = true;
            self.stale_groups -= 1;
        }
    }

    /// Writes a group as the persisted record of `type_index` keeps it: its id, whether it is
    /// known whole, and the index fields and compressed text of its documents of that type, as
    /// they are held. A group whose draft is of another type than its published document is
    /// persisted in the records of both types.
    fn encode_group(&self, published: &str, group: &Group, type_index: u16, out: &mut Writer) {
        let count = group.docs.iter().filter(|doc| doc.type_index == type_index).count();
        if count == 0 {
            return;
        }
        out.str(published);
        out.u8(u8::from(group.known));
        out.u16(count as u16);
        for doc in group.docs.iter().filter(|doc| doc.type_index == type_index) {
            match doc.kind {
                Kind::Published => out.u8(0),
                Kind::Draft => out.u8(1),
                Kind::Version(release) => {
                    out.u8(2);
                    out.str(&self.releases[release as usize]);
                }
            }
            out.u32(doc.created);
            out.u32(doc.updated);
            out.u32(doc.len);
            out.u64(doc.rev);
            out.u8(u8::from(doc.dict));
            out.bytes(doc.title.as_deref().map(str::as_bytes));
            out.bytes(doc.body.as_deref());
        }
    }

    /// Adds the groups of a persisted record of a type, as stale until the type is revalidated.
    /// A group this session already fetched is newer and stays as it is; one restored from the
    /// record of another type gets the documents of this one. Returns the documents added,
    /// `None` for a record that does not decode.
    fn restore_chunk(&mut self, type_index: u16, bytes: &[u8]) -> Option<usize> {
        let mut reader = Reader { bytes };
        let mut added = 0;
        while !reader.bytes.is_empty() {
            let published = reader.str()?;
            let known = reader.u8()? == 1;
            let count = reader.u16()? as usize;
            let mut docs = Vec::with_capacity(count);
            for _ in 0..count {
                let kind = match reader.u8()? {
                    0 => Kind::Published,
                    1 => Kind::Draft,
                    _ => Kind::Version(self.intern_release(reader.str()?)),
                };
                docs.push(Doc {
                    kind,
                    type_index,
                    pass: 0,
                    created: reader.u32()?,
                    updated: reader.u32()?,
                    len: reader.u32()?,
                    rev: reader.u64()?,
                    dict: reader.u8()? == 1,
                    title: reader.bytes()?.map(|title| String::from_utf8_lossy(title).into()),
                    body: reader.bytes()?.map(Box::from),
                });
            }
            let existing = self.groups.get(published).map(|group| group.fresh);
            if existing == Some(true) {
                continue;
            }
            let mut cost = match existing {
                Some(_) => 0,
                None => group_cost(published),
            };
            let held: Vec<Kind> = self
                .groups
                .get(published)
                .map(|group| group.docs.iter().map(|doc| doc.kind).collect())
                .unwrap_or_default();
            docs.retain(|doc| !held.contains(&doc.kind));
            for doc in &docs {
                cost += doc_cost(doc);
                if doc.body.is_some() {
                    self.bodies += 1;
                    self.json_bytes += doc.len as usize;
                }
            }
            added += docs.len();
            self.bytes += cost;
            match self.groups.get_mut(published) {
                Some(group) => {
                    group.known &= known;
                    group.docs.extend(docs);
                }
                None => {
                    self.stale_groups += 1;
                    self.groups.insert(published.into(), Group { docs, type_index, known, fresh: false, last_used: 0 });
                }
            }
        }
        Some(added)
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
                types.push(doc.type_index);
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
        for type_index in &types {
            if let Some(state) = self.types.get_mut(*type_index as usize) {
                state.dirty = true;
            }
        }
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
    /// Documents restored from the persisted replica, when that finished, and how long it took.
    pub restored_docs: usize,
    pub restored: Option<(f64, f64)>,
    /// Restored groups not revalidated yet.
    pub stale_groups: usize,
    /// When the persisted replica last saved, the bytes it wrote, and how long that took.
    pub persisted: Option<(f64, usize, f64)>,
    pub saving: bool,
}

/// A cached group: the published document and the draft (`None` when missing) and every
/// release version, by raw id, and the ids of the versions. A `stale` group was restored from
/// the persisted replica and not revalidated yet.
pub struct Seed {
    pub docs: Vec<(String, Option<Value>)>,
    pub versions: Vec<String>,
    pub stale: bool,
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
    pump_queued: Cell<bool>,
    /// Groups `prefetch` asks for, until they are fetched.
    prefetched: RefCell<HashSet<Arc<str>>>,
    fetches: Cell<usize>,
    fetched: Cell<usize>,
    budget: usize,
    /// The persisted replica: off with `?persist=0`, and `None` without IndexedDB.
    persist: bool,
    db: RefCell<Option<Db>>,
    user: RefCell<String>,
    /// Workers wait for both: the listener to open, and the persisted replica to restore.
    welcomed: Cell<bool>,
    restored: Cell<bool>,
    restored_docs: Cell<usize>,
    restored_at: Cell<Option<(f64, f64)>>,
    saving: Cell<bool>,
    save_again: Cell<bool>,
    save_requests: Cell<u32>,
    meta_saved: Cell<bool>,
    /// Types the persisted replica holds that the schema no longer has, or no longer titles
    /// the same way: the next save deletes them.
    orphans: RefCell<Vec<String>>,
    persisted: Cell<Option<(f64, usize, f64)>>,
    pub status: ArcRwSignal<Status>,
}

fn url_param(name: &str) -> Option<String> {
    web_sys::window()
        .and_then(|window| window.location().search().ok())
        .and_then(|search| web_sys::UrlSearchParams::new_with_str(&search).ok())
        .and_then(|params| params.get(name))
}

/// The cache budget in bytes: `?cache=<MiB>` in the URL, or the default.
pub fn budget_from_url() -> usize {
    let mib = url_param("cache")
        .and_then(|value| value.parse::<f64>().ok())
        .filter(|mib| *mib >= 0.0)
        .unwrap_or(DEFAULT_BUDGET_MIB);
    (mib * 1024.0 * 1024.0) as usize
}

/// Whether the replica persists, unless `?persist=0`; benchmarks use it to load cold.
pub fn persist_from_url() -> bool {
    url_param("persist").is_none_or(|value| value != "0")
}

/// Starts reading the persisted replica, before the user is known.
pub fn preload() {
    if persist_from_url() {
        persist::preload();
    }
}

/// Deletes the persisted replica, when the user logs out.
pub async fn forget() {
    persist::forget().await;
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
        "restoredDocs": status.restored_docs,
        "restoredAt": status.restored.map(|(at, _)| at),
        "restoredIn": status.restored.map(|(_, took)| took),
        "staleGroups": status.stale_groups,
        "persistedAt": status.persisted.map(|(at, _, _)| at),
        "persistedBytes": status.persisted.map(|(_, bytes, _)| bytes),
        "persistedIn": status.persisted.map(|(_, _, took)| took),
        "saving": status.saving,
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
        pump_queued: Cell::new(false),
        prefetched: RefCell::default(),
        fetches: Cell::new(0),
        fetched: Cell::new(0),
        budget: budget_from_url(),
        persist: persist_from_url(),
        db: RefCell::new(None),
        user: RefCell::default(),
        welcomed: Cell::new(false),
        restored: Cell::new(false),
        restored_docs: Cell::new(0),
        restored_at: Cell::new(None),
        saving: Cell::new(false),
        save_again: Cell::new(false),
        save_requests: Cell::new(0),
        meta_saved: Cell::new(false),
        orphans: RefCell::default(),
        persisted: Cell::new(None),
        status: ArcRwSignal::new(Status::default()),
    });
}

pub fn replica() -> Rc<Replica> {
    REPLICA.with(Rc::clone)
}

impl Replica {
    /// Restores the persisted replica of `user`, opens the listener for every document type of
    /// the schema, and warms up (or revalidates what was restored) once both are done.
    pub fn start(&self, client: Client, user: &str) {
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
                    revalidate: false,
                    dirty: false,
                    generation: 0,
                });
            }
        }
        *self.lists.borrow_mut() = names.iter().map(|_| ArcRwSignal::new(0)).collect();
        *self.rows.borrow_mut() = names.iter().map(|_| ArcRwSignal::new(0)).collect();
        *self.queue.borrow_mut() = (0..names.len() as u16).collect();
        *self.client.borrow_mut() = Some(client.clone());
        user.clone_into(&mut self.user.borrow_mut());
        self.started.set(now_ms());
        let params = Map::from_iter([("types".to_owned(), json!(names))]);
        let options =
            ListenOptions { include_result: true, include_all_versions: true, tag: "replica.listener".into() };
        let listener = client.listen("*[_type in $types]", params, options, |event| replica().on_event(event));
        *self.listener.borrow_mut() = Some(listener);
        if self.persist {
            spawn_local(restore());
            // A tab that is hidden may be closed or discarded next: save what changed.
            let on_visibility = Closure::<dyn Fn()>::new(|| {
                if web_sys::window().is_some_and(|window| window.document().is_some_and(|document| document.hidden())) {
                    spawn_local(save());
                }
            });
            if let Some(document) = web_sys::window().and_then(|window| window.document()) {
                let _ = document
                    .add_event_listener_with_callback("visibilitychange", on_visibility.as_ref().unchecked_ref());
            }
            on_visibility.forget();
        } else {
            self.restored.set(true);
        }
        self.update_status();
    }

    /// Saves the persisted replica `delay` ms after the last call.
    fn schedule_save(&self, delay: u32) {
        if !self.persist {
            return;
        }
        let request = self.save_requests.get().wrapping_add(1);
        self.save_requests.set(request);
        spawn_local(async move {
            sleep(delay).await;
            if replica().save_requests.get() == request {
                save().await;
            }
        });
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
            restored_docs: self.restored_docs.get(),
            restored: self.restored_at.get(),
            stale_groups: inner.stale_groups,
            persisted: self.persisted.get(),
            saving: self.saving.get(),
        };
        drop(inner);
        if status != previous {
            publish_status(&status);
            self.status.set(status);
        }
    }

    fn on_event(&self, event: ListenEvent) {
        match event {
            ListenEvent::Welcome { reconnected: false } => {
                self.welcomed.set(true);
                self.spawn_workers();
            }
            ListenEvent::Welcome { reconnected: true } => {
                // Events may have been missed: check every type that was fetched against the
                // dataset again, without showing its rows as stale for what is likely nothing.
                let count = {
                    let mut inner = self.inner.borrow_mut();
                    for state in &mut inner.types {
                        state.revalidate |= state.pass > 0 || state.complete;
                    }
                    inner.types.len() as u16
                };
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
                    self.schedule_save(SAVE_AFTER_CHANGE_MS);
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
        if !self.welcomed.get() || !self.restored.get() {
            return;
        }
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

    /// The row preview of a cached group as `perspective` shows it, tracked by its type; `stale`
    /// while the group is restored and not revalidated yet.
    pub fn preview(&self, type_name: &str, published: &str, perspective: &Perspective) -> Option<DocPreview> {
        if let Some(type_index) = self.type_of(type_name) {
            Self::track(&self.rows, type_index);
        }
        let (value, draft, stale) = {
            let mut inner = self.inner.borrow_mut();
            inner.clock += 1;
            let clock = inner.clock;
            let view = inner.view(perspective);
            let group = inner.groups.get_mut(published).filter(|group| group.complete())?;
            group.last_used = clock;
            let inner = &*inner;
            let group = inner.groups.get(published)?;
            let doc = group.shown(view)?;
            (inner.value(doc)?, doc.kind != Kind::Published, !group.fresh)
        };
        Some(DocPreview { stale, ..DocPreview::from_document(published, &value, draft) })
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
        let stale = !group.fresh;
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
        Some(Seed { docs, versions, stale })
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
        // The rows a render mounts ask one by one: pumping after them all fills whole batches,
        // where pumping on each would send the first rows alone and queue the rest behind them.
        if first {
            self.pending.borrow_mut().push(published);
            if !self.pump_queued.replace(true) {
                spawn_local(async {
                    let replica = replica();
                    replica.pump_queued.set(false);
                    replica.pump();
                });
            }
        }
    }

    /// Asks for the groups of the first rows a list is about to show that are not held current,
    /// before the rows mount and ask: rendering a page of rows can take longer than the request.
    pub fn prefetch(&self, ids: &[Arc<str>]) {
        let ids: Vec<Arc<str>> = {
            let inner = self.inner.borrow();
            let prefetched = self.prefetched.borrow();
            ids.iter()
                .take(FETCH_BATCH)
                .filter(|id| {
                    !prefetched.contains(*id)
                        && !inner.groups.get(*id).is_some_and(|group| group.fresh && group.complete())
                })
                .cloned()
                .collect()
        };
        for id in ids {
            self.prefetched.borrow_mut().insert(id.clone());
            self.want(id);
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

    /// `first`, and when it is to be revalidated and holds few documents, the queued types that
    /// are too and hold few documents, taken off the queue to be listed with it.
    fn revalidation_batch(&self, first: u16) -> Vec<u16> {
        let mut batch = vec![first];
        let inner = self.inner.borrow();
        if !inner.types[first as usize].revalidate {
            return batch;
        }
        let mut counts = vec![0usize; inner.types.len()];
        for doc in inner.groups.values().flat_map(|group| &group.docs) {
            if let Some(count) = counts.get_mut(doc.type_index as usize) {
                *count += 1;
            }
        }
        let mut total = counts[first as usize];
        if total >= BATCH_DOCS {
            return batch;
        }
        self.queue.borrow_mut().retain(|&type_index| {
            let count = counts[type_index as usize];
            let take =
                batch.len() < BATCH_TYPES && inner.types[type_index as usize].revalidate && total + count < BATCH_DOCS;
            if take {
                batch.push(type_index);
                total += count;
            }
            !take
        });
        batch
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

/// Takes types off the queue: checks what the replica holds of a type when that may be out of
/// date, then fetches the type whole unless it is already, was skipped, or the budget is full.
async fn warm_worker() {
    loop {
        let replica = replica();
        let next = replica.queue.borrow_mut().pop_front();
        let Some(type_index) = next else { break };
        let batch = replica.revalidation_batch(type_index);
        if replica.inner.borrow().types[type_index as usize].revalidate {
            revalidate_types(&batch).await;
        }
        for type_index in batch {
            let warm = {
                let inner = replica.inner.borrow();
                let state = &inner.types[type_index as usize];
                !state.complete && !state.skipped
            };
            if warm && !replica.full.get() {
                warm_type(type_index).await;
            }
        }
    }
    let replica = replica();
    replica.workers.set(replica.workers.get() - 1);
    replica.update_status();
    if replica.workers.get() == 0 {
        replica.schedule_save(SAVE_AFTER_WARM_MS);
    }
}

/// Stores a query's documents as they stream in, in slices that yield to the main thread, and
/// runs the query again when it fails, keeping what it read. Returns how many documents it
/// returned, `None` once it failed `RETRIES` times.
async fn stream_documents(
    type_index: u16,
    groq: &str,
    params: &Map<String, Value>,
    tag: &str,
    limit: usize,
    fields: &[&str],
    since: u64,
) -> Option<usize> {
    let replica = replica();
    let mut attempt = 0;
    let mut count = 0;
    let mut held = Vec::new();
    loop {
        let mut failed = false;
        match replica.client().query_documents("raw", groq, params, tag, limit, fields).await {
            Err(_) => failed = true,
            Ok(mut stream) => loop {
                match stream.next().await {
                    Ok(Some(queried)) => {
                        count += 1;
                        if let Some(id) = queried.fields.get("_id").and_then(Value::as_str).map(str::to_owned) {
                            held.push((id, queried));
                        }
                    }
                    Ok(None) => break,
                    Err(_) => {
                        failed = true;
                        break;
                    }
                }
                if slice_expired() {
                    replica.inner.borrow_mut().store_warmed(type_index, &mut held, since);
                    yield_to_main().await;
                }
            },
        }
        replica.inner.borrow_mut().store_warmed(type_index, &mut held, since);
        if !failed {
            return Some(count);
        }
        if attempt == RETRIES {
            return None;
        }
        sleep(1000 << attempt).await;
        attempt += 1;
        count = 0;
    }
}

/// Checks what the replica holds of some types against the dataset, for a fraction of a
/// warm-up: lists the id and revision of every document of the types, confirms the cached
/// documents whose revision is unchanged, refetches the changed ones (and the new ones of a type
/// held whole, or of a group known whole), and drops those deleted meanwhile. A replica restored from the
/// last visit comes back current this way, and so does one that missed events while the listener
/// reconnected. A type whose pass fails is left to revalidate, its rows still stale.
async fn revalidate_types(batch: &[u16]) {
    let replica = replica();
    let (names, passes, since) = {
        let mut inner = replica.inner.borrow_mut();
        let since = inner.seq;
        let mut names = Vec::new();
        let mut passes = HashMap::new();
        for &type_index in batch {
            let state = &mut inner.types[type_index as usize];
            state.pass += 1;
            names.push(state.name.to_string());
            passes.insert(type_index, (state.pass, state.complete));
        }
        (names, passes, since)
    };
    let current = |type_index: u16| replica.inner.borrow().types[type_index as usize].pass == passes[&type_index].0;
    let groq = format!("*[_type in $types && _id > $after] | order(_id) [0...{LIST_PAGE}] {{_id, _type, _rev}}");
    let mut after = String::new();
    let mut changed: HashMap<u16, Vec<String>> = HashMap::new();
    let mut attempt = 0;
    loop {
        let params = Map::from_iter([("types".to_owned(), json!(names)), ("after".to_owned(), json!(after))]);
        let mut count = 0;
        let mut failed = false;
        let fields = ["_id", "_type", "_rev"];
        match replica.client().query_documents("raw", &groq, &params, "replica.revalidate", 0, &fields).await {
            Err(_) => failed = true,
            Ok(mut stream) => loop {
                let listed = match stream.next().await {
                    Ok(Some(listed)) => listed,
                    Ok(None) => break,
                    Err(_) => {
                        failed = true;
                        break;
                    }
                };
                count += 1;
                let field = |key: &str| listed.fields.get(key).and_then(Value::as_str);
                let (Some(id), Some(name), Some(rev)) = (field("_id"), field("_type"), field("_rev")) else { continue };
                id.clone_into(&mut after);
                let refetch = {
                    let mut inner = replica.inner.borrow_mut();
                    let pass =
                        inner.type_index.get(name).and_then(|type_index| Some((*type_index, passes.get(type_index)?)));
                    pass.filter(|(_, (pass, complete))| inner.check_listed(id, rev, *pass, *complete))
                        .map(|(type_index, _)| type_index)
                };
                if let Some(type_index) = refetch {
                    changed.entry(type_index).or_default().push(id.to_owned());
                }
                if slice_expired() {
                    yield_to_main().await;
                }
            },
        }
        if failed {
            if attempt == RETRIES {
                return;
            }
            sleep(1000 << attempt).await;
            attempt += 1;
            continue;
        }
        attempt = 0;
        if !batch.iter().any(|type_index| current(*type_index)) {
            return;
        }
        if count < LIST_PAGE {
            break;
        }
    }
    'types: for &type_index in batch {
        let title = replica.inner.borrow().types[type_index as usize].title_field.clone();
        let fields: Vec<&str> = INDEX_FIELDS.into_iter().chain(title.as_deref()).collect();
        for ids in changed.get(&type_index).map_or(&[][..], Vec::as_slice).chunks(REFETCH_BATCH) {
            if !current(type_index) {
                continue 'types;
            }
            let params = Map::from_iter([("ids".to_owned(), json!(ids))]);
            let fetched =
                stream_documents(type_index, "*[_id in $ids]", &params, "replica.refetch", DOC_LIMIT, &fields, since)
                    .await;
            replica.bump(type_index);
            if fetched.is_none() {
                return;
            }
        }
        if !current(type_index) {
            continue;
        }
        let evicted = {
            let mut inner = replica.inner.borrow_mut();
            let (pass, _) = passes[&type_index];
            inner.end_pass(type_index, pass, since);
            inner.types[type_index as usize].revalidate = false;
            inner.evict(replica.budget)
        };
        replica.bump(type_index);
        for type_index in evicted {
            replica.bump_rows(type_index);
        }
        // Ending a pass walks every group, and a batch can end dozens of types at once.
        if slice_expired() {
            yield_to_main().await;
        }
    }
    replica.update_status();
}

/// Restores the replica persisted by the last visit of the same user, type by type and in
/// slices: each type with its dictionary and its index state, each group stale until its type is
/// revalidated. Records of another user or format are deleted rather than read.
async fn restore() {
    let replica = replica();
    let started = now_ms();
    let entries = persist::take_preloaded().await;
    let db = persist::open().await;
    db.clone_into(&mut replica.db.borrow_mut());
    let user = replica.user.borrow().clone();
    let mut valid = false;
    let mut records = Vec::new();
    let mut chunks = HashMap::new();
    for (key, value) in entries {
        if key == "meta" {
            let meta = value.as_string().and_then(|text| serde_json::from_str::<Value>(&text).ok());
            valid = meta.is_some_and(|meta| meta["format"] == json!(FORMAT) && meta["user"] == json!(user));
        } else if let Some(name) = key.strip_prefix("m:") {
            records.push((name.to_owned(), Uint8Array::new(&value).to_vec()));
        } else {
            chunks.insert(key, value);
        }
    }
    if !valid && !(records.is_empty() && chunks.is_empty()) {
        if let Some(db) = &db {
            db.clear().await;
        }
        records.clear();
    }
    // The type the address shows restores first, so its list is not waiting on the others.
    let shown = web_sys::window()
        .and_then(|window| window.location().pathname().ok())
        .and_then(|pathname| Route::parse(&pathname).type_name);
    records.sort_by_key(|(name, _)| shown.as_deref() != Some(name.as_str()));
    let mut restored = 0;
    for (name, bytes) in records {
        let record = TypeRecord::decode(&bytes);
        let type_index = replica.type_of(&name);
        let (Some(record), Some(type_index)) = (record, type_index) else {
            replica.orphans.borrow_mut().push(name);
            continue;
        };
        {
            let mut inner = replica.inner.borrow_mut();
            let state = &mut inner.types[type_index as usize];
            // Documents compressed with another dictionary than the one in memory cannot be read.
            let readable = state.dictionary.is_none() || state.dictionary == record.dictionary;
            if state.title_field != record.title_field || !readable {
                drop(inner);
                replica.orphans.borrow_mut().push(name);
                continue;
            }
            state.generation = record.generation;
            state.skipped = record.skipped;
            state.revalidate = true;
            if state.dictionary.is_none() {
                let added = record.dictionary.as_ref().map_or(0, |dictionary| dictionary.len());
                state.dictionary = record.dictionary.clone();
                inner.bytes += added;
            }
        }
        let prefix = chunk_prefix(&name, Some(record.generation));
        let mut whole = true;
        for chunk in 0..record.chunks {
            let read = chunks.remove(&format!("{prefix}{chunk}")).and_then(|value| {
                let bytes = Uint8Array::new(&value).to_vec();
                replica.inner.borrow_mut().restore_chunk(type_index, &bytes)
            });
            whole &= read.is_some();
            restored += read.unwrap_or(0);
            if slice_expired() {
                // The rows on screen show what has been restored so far.
                replica.bump_rows(type_index);
                yield_to_main().await;
            }
        }
        // A type missing a record is warmed again rather than listed from what is left.
        replica.inner.borrow_mut().types[type_index as usize].complete = record.complete && whole;
        replica.bump(type_index);
    }
    let evicted = replica.inner.borrow_mut().evict(replica.budget);
    for type_index in evicted {
        replica.bump_rows(type_index);
    }
    let now = now_ms();
    replica.restored_docs.set(restored);
    replica.restored_at.set(Some((now, now - started)));
    replica.restored.set(true);
    replica.update_status();
    replica.spawn_workers();
}

/// Saves the types that changed since the last save, each as a new generation of records that
/// replaces the previous one only once it is written whole, so a tab closed halfway through
/// leaves the previous generation intact. Encoding yields to the main thread between groups and
/// every record is a transaction of its own. Groups are written newest first, as lists sort by
/// default, so the rows a list opens on are in the first record its type restores.
async fn save() {
    let replica = replica();
    if !replica.restored.get() {
        return;
    }
    if replica.saving.get() {
        replica.save_again.set(true);
        return;
    }
    let Some(db) = replica.db.borrow().clone() else { return };
    let dirty: Vec<u16> = {
        let inner = replica.inner.borrow();
        (0..inner.types.len() as u16).filter(|index| inner.types[*index as usize].dirty).collect()
    };
    let orphans = std::mem::take(&mut *replica.orphans.borrow_mut());
    if dirty.is_empty() && orphans.is_empty() && replica.meta_saved.get() {
        return;
    }
    replica.saving.set(true);
    replica.update_status();
    let started = now_ms();
    let mut written = 0;
    let mut writes =
        vec![Write::Put("meta".into(), json!({"format": FORMAT, "user": *replica.user.borrow()}).to_string().into())];
    for name in orphans {
        writes.extend(Write::delete(&type_key(&name)));
        writes.extend(Write::delete_prefix(&chunk_prefix(&name, None)));
    }
    let saved = db.write(writes).await;
    replica.meta_saved.set(saved);
    let mut ids: HashMap<u16, Vec<(Arc<str>, u32)>> = dirty.iter().map(|index| (*index, Vec::new())).collect();
    for (id, group) in &replica.inner.borrow().groups {
        for doc in &group.docs {
            let Some(list) = ids.get_mut(&doc.type_index) else { continue };
            match list.last_mut() {
                Some((last, updated)) if last == id => *updated = (*updated).max(doc.updated),
                _ => list.push((id.clone(), doc.updated)),
            }
        }
    }
    for list in ids.values_mut() {
        list.sort_unstable_by_key(|(_, updated)| std::cmp::Reverse(*updated));
    }
    for type_index in dirty {
        let (name, generation) = {
            let mut inner = replica.inner.borrow_mut();
            let state = &mut inner.types[type_index as usize];
            state.dirty = false;
            (state.name.to_string(), state.generation + 1)
        };
        let prefix = chunk_prefix(&name, Some(generation));
        let mut ok = true;
        let mut chunks = 0;
        let mut chunk = Writer::default();
        let groups = ids.remove(&type_index).unwrap_or_default();
        let last = groups.len();
        for (index, (id, _)) in groups.into_iter().enumerate() {
            {
                let inner = replica.inner.borrow();
                if let Some(group) = inner.groups.get(&id) {
                    inner.encode_group(&id, group, type_index, &mut chunk);
                }
            }
            if chunk.0.len() >= CHUNK_BYTES || (index + 1 == last && !chunk.0.is_empty()) {
                let bytes = std::mem::take(&mut chunk.0);
                written += bytes.len();
                let mut writes = Vec::new();
                if chunks == 0 {
                    // What a save interrupted at this generation left.
                    writes.extend(Write::delete_prefix(&prefix));
                }
                writes.push(Write::Put(format!("{prefix}{chunks}"), Uint8Array::from(bytes.as_slice()).into()));
                ok &= db.write(writes).await;
                chunks += 1;
            }
            if slice_expired() {
                yield_to_main().await;
            }
        }
        let record = {
            let inner = replica.inner.borrow();
            let state = &inner.types[type_index as usize];
            TypeRecord {
                generation,
                chunks,
                complete: state.complete,
                skipped: state.skipped,
                title_field: state.title_field.clone(),
                dictionary: state.dictionary.clone(),
            }
        };
        if ok {
            let mut writes = vec![Write::Put(type_key(&name), Uint8Array::from(record.encode().as_slice()).into())];
            writes.extend(Write::delete_prefix_except(&chunk_prefix(&name, None), &prefix));
            ok = db.write(writes).await;
        }
        let mut inner = replica.inner.borrow_mut();
        let state = &mut inner.types[type_index as usize];
        match ok {
            true => state.generation = generation,
            false => state.dirty = true,
        }
    }
    let now = now_ms();
    replica.persisted.set(Some((now, written, now - started)));
    replica.saving.set(false);
    replica.update_status();
    if replica.save_again.replace(false) {
        spawn_local(save());
    }
}

/// Fetches every document of a type in pages ordered by id, small at first so a type of large
/// documents is noticed early, then sized to about `PAGE_BYTES`. A page is stored document by
/// document as it downloads, in slices that yield to the main thread, so neither parsing a page
/// nor storing it blocks a frame or a key press.
async fn warm_type(type_index: u16) {
    let replica = replica();
    let (name, title, pass, since) = {
        let mut inner = replica.inner.borrow_mut();
        let state = &mut inner.types[type_index as usize];
        state.pass += 1;
        state.skipped = false;
        (state.name.to_string(), state.title_field.clone(), state.pass, inner.seq)
    };
    let fields: Vec<&str> = INDEX_FIELDS.into_iter().chain(title.as_deref()).collect();
    let mut after = String::new();
    let mut size = FIRST_PAGE;
    // Only the documents small enough to keep count towards the average, so one huge document
    // neither skips a type of small ones nor shrinks its pages.
    let (mut seen, mut kept, mut kept_bytes) = (0usize, 0usize, 0usize);
    let mut attempt = 0;
    // Until the type has a dictionary, its documents wait for enough of them to make it from.
    let mut held = Vec::new();
    let (mut held_whole, mut held_bytes) = (0usize, 0usize);
    loop {
        if !replica.would_fit(size, (kept > 0).then(|| kept_bytes / kept)) {
            // The types still queued are only revalidated.
            replica.full.set(true);
            replica.update_status();
            return;
        }
        let groq = format!("*[_type == $type && _id > $after] | order(_id) [0...{size}]");
        let params = Map::from_iter([("type".to_owned(), json!(name)), ("after".to_owned(), json!(after))]);
        let mut count = 0;
        let mut failed = false;
        match replica.client().query_documents("raw", &groq, &params, "replica.warm", DOC_LIMIT, &fields).await {
            Err(_) => failed = true,
            Ok(mut stream) => loop {
                let queried = match stream.next().await {
                    Ok(Some(queried)) => queried,
                    Ok(None) => break,
                    Err(_) => {
                        failed = true;
                        break;
                    }
                };
                count += 1;
                let Some(id) = queried.fields.get("_id").and_then(Value::as_str).map(str::to_owned) else { continue };
                seen += 1;
                if queried.json.is_some() {
                    kept += 1;
                    kept_bytes += queried.len;
                    held_whole += 1;
                    held_bytes += queried.len;
                }
                after.clone_from(&id);
                held.push((id, queried));
                {
                    let mut inner = replica.inner.borrow_mut();
                    if inner.types[type_index as usize].dictionary.is_some()
                        || (held_whole >= 8 && (held_bytes >= DICTIONARY_BYTES || held_whole >= 64))
                    {
                        inner.store_warmed(type_index, &mut held, since);
                        (held_whole, held_bytes) = (0, 0);
                    }
                }
                if slice_expired() {
                    yield_to_main().await;
                    if replica.full.get() {
                        // Another worker filled the budget: the rest of the page is not needed.
                        failed = true;
                        break;
                    }
                }
            },
        }
        if failed {
            // What a page that failed partway did read is good, and the next attempt goes on
            // after it.
            replica.inner.borrow_mut().store_warmed(type_index, &mut held, since);
            (held_whole, held_bytes) = (0, 0);
            replica.bump(type_index);
            replica.update_status();
            if replica.full.get() || attempt == RETRIES {
                return;
            }
            sleep(1000 << attempt).await;
            attempt += 1;
            continue;
        }
        attempt = 0;
        let done = {
            let mut inner = replica.inner.borrow_mut();
            let skip = seen >= FIRST_PAGE && (kept == 0 || kept_bytes / kept > TYPE_AVERAGE_LIMIT);
            // A reconnect starts a new pass of every type while this one may still run.
            let superseded = inner.types[type_index as usize].pass != pass;
            let done = count < size || skip || superseded;
            if done {
                inner.store_warmed(type_index, &mut held, since);
            }
            if !superseded && count < size {
                inner.complete_type(type_index, pass, since);
            } else if !superseded && skip {
                let state = &mut inner.types[type_index as usize];
                state.dirty |= !state.skipped;
                state.skipped = true;
            }
            done
        };
        replica.bump(type_index);
        replica.update_status();
        if done {
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
        let mut returned = HashSet::new();
        for raw in &page.result {
            let text = raw.get();
            let Some(doc) = inner.fields(text) else { continue };
            let Some(id) = doc.get("_id").and_then(Value::as_str) else { continue };
            returned.insert(id.to_owned());
            if inner.touched.get(id).is_some_and(|seq| *seq > since) {
                continue;
            }
            types.extend(inner.insert(id, text, &doc, true));
        }
        for id in &ids {
            // A group restored stale may hold documents deleted since.
            let gone: Vec<String> = inner.groups.get(id).map_or_else(Vec::new, |group| {
                group
                    .docs
                    .iter()
                    .map(|doc| inner.raw_id(id, doc.kind))
                    .filter(|raw| {
                        !returned.contains(raw) && inner.touched.get(raw.as_str()).is_none_or(|seq| *seq <= since)
                    })
                    .collect()
            });
            for raw in gone {
                types.extend(inner.remove(&raw).map(|type_index| (type_index, true)));
            }
            // The rows that asked for the groups show them now, so they are the last to evict.
            inner.clock += 1;
            let clock = inner.clock;
            inner.set_fresh(id);
            match inner.groups.get_mut(id) {
                Some(group) => {
                    // The records of its documents' types persist that the group is known.
                    let newly_known: Vec<u16> = match group.known {
                        true => Vec::new(),
                        false => group.docs.iter().map(|doc| doc.type_index).collect(),
                    };
                    group.known = true;
                    group.last_used = clock;
                    types.push((group.type_index, false));
                    for type_index in newly_known {
                        if let Some(state) = inner.types.get_mut(type_index as usize) {
                            state.dirty = true;
                        }
                    }
                }
                None => {
                    let cost = group_cost(id);
                    inner.groups.insert(
                        id.clone(),
                        Group { docs: Vec::new(), type_index: u16::MAX, known: true, fresh: true, last_used: clock },
                    );
                    inner.bytes += cost;
                }
            }
        }
        types.extend(inner.evict(replica.budget).into_iter().map(|type_index| (type_index, false)));
        replica.fetched.set(replica.fetched.get() + ids.len());
        replica.schedule_save(SAVE_AFTER_CHANGE_MS);
    } else {
        // Asked for again by the rows that still show them.
        replica.pending.borrow_mut().extend(ids.iter().cloned());
    }
    replica.in_flight.borrow_mut().retain(|id| !ids.contains(id));
    for id in &ids {
        if replica.prefetched.borrow_mut().remove(id) {
            replica.unwant(id);
        }
    }
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
                revalidate: false,
                dirty: false,
                generation: 0,
            });
        }
        inner
    }

    /// `inner`'s groups as the persisted replica would restore them in a new session.
    fn reloaded(inner: &Inner) -> Inner {
        let mut restored = self::inner();
        for type_index in 0..inner.types.len() as u16 {
            let mut out = Writer::default();
            for (id, group) in &inner.groups {
                inner.encode_group(id, group, type_index, &mut out);
            }
            restored.types[type_index as usize].dictionary = inner.types[type_index as usize].dictionary.clone();
            restored.types[type_index as usize].pass = 0;
            restored.restore_chunk(type_index, &out.0).unwrap();
        }
        restored
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

    #[test]
    fn restores_persisted_groups_as_they_were_held_and_stale() {
        let mut inner = inner();
        let docs: Vec<Value> = (0..12)
            .map(|index| json!({"_id": format!("a{index}"), "_type": "author", "_rev": format!("r{index}"), "name": format!("Ada {index}"), "_updatedAt": "2024-05-01T10:00:00Z"}))
            .collect();
        let texts: Vec<String> = docs.iter().map(Value::to_string).collect();
        inner.make_dictionary(0, &texts.iter().map(String::as_str).collect::<Vec<_>>());
        for doc in &docs {
            put(&mut inner, doc.clone());
        }
        put(&mut inner, json!({"_id": "drafts.a1", "_type": "author", "_rev": "d1", "name": "Ada draft"}));
        put(&mut inner, json!({"_id": "versions.spring.a1", "_type": "author", "_rev": "v1", "name": "Ada spring"}));
        inner.complete_type(0, 1, 0);

        let restored = reloaded(&inner);
        assert_eq!(restored.groups.len(), 12);
        assert_eq!(restored.stale_groups, 12);
        assert_eq!((restored.bodies, restored.json_bytes), (inner.bodies, inner.json_bytes));
        let group = &restored.groups["a1"];
        assert!(group.complete() && !group.fresh);
        assert_eq!(group.docs.len(), 3);
        let spring = restored.release_index["spring"];
        let version = group.get(Kind::Version(spring)).unwrap();
        assert_eq!(restored.value(version).unwrap()["name"], "Ada spring");
        assert_eq!(restored.value(group.get(Kind::Published).unwrap()).unwrap(), docs[1]);
        assert_eq!(group.get(Kind::Draft).unwrap().title.as_deref(), Some("ada draft"));
        let ids = |list: Vec<Arc<str>>| list.len();
        assert_eq!(ids(restored.list(0, View::Drafts, Ordering::Title, "ada")), 12);

        let record = TypeRecord {
            generation: 7,
            chunks: 2,
            complete: true,
            skipped: false,
            title_field: Some("name".into()),
            dictionary: inner.types[0].dictionary.clone(),
        };
        let decoded = TypeRecord::decode(&record.encode()).unwrap();
        assert_eq!((decoded.generation, decoded.chunks, decoded.complete, decoded.skipped), (7, 2, true, false));
        assert_eq!(decoded.title_field.as_deref(), Some("name"));
        assert_eq!(decoded.dictionary, record.dictionary);
        assert!(TypeRecord::decode(&record.encode()[..5]).is_none());
    }

    #[test]
    fn revalidates_restored_groups_against_the_listed_revisions() {
        let mut inner = inner();
        for (id, rev) in [("a", "r1"), ("b", "r1"), ("drafts.b", "d1"), ("c", "r1")] {
            put(&mut inner, json!({"_id": id, "_type": "author", "_rev": rev, "name": id}));
        }
        inner.complete_type(0, 1, 0);
        let mut restored = reloaded(&inner);
        restored.types[0].complete = true;
        restored.types[0].pass = 1;
        // The dataset now: `a` unchanged, `b` edited, its draft published away, `c` deleted, and
        // a new draft of `a`.
        assert!(!restored.check_listed("a", "r1", 1, true));
        assert!(restored.check_listed("b", "r2", 1, true));
        assert!(restored.check_listed("drafts.a", "n1", 1, true));
        // The changed and new documents are refetched…
        put(&mut restored, json!({"_id": "b", "_type": "author", "_rev": "r2", "name": "b2"}));
        put(&mut restored, json!({"_id": "drafts.a", "_type": "author", "_rev": "n1", "name": "a draft"}));
        // …and the pass ends: what it neither confirmed nor refetched is gone.
        restored.end_pass(0, 1, 0);
        assert_eq!(restored.stale_groups, 0);
        assert!(restored.groups.values().all(|group| group.fresh));
        let names = |restored: &Inner, id: &str| -> Vec<String> {
            let group = &restored.groups[id];
            group.docs.iter().map(|doc| restored.value(doc).unwrap()["name"].as_str().unwrap().to_owned()).collect()
        };
        assert_eq!(names(&restored, "a").len(), 2);
        assert_eq!(names(&restored, "b"), ["b2"]);
        assert!(restored.groups["c"].docs.is_empty());
    }

    #[test]
    fn keeps_a_group_whose_draft_is_of_another_type() {
        let mut inner = inner();
        put(&mut inner, json!({"_id": "m", "_type": "author", "_rev": "r1", "name": "Mixed"}));
        put(&mut inner, json!({"_id": "drafts.m", "_type": "book", "_rev": "d1", "title": "Mixed draft"}));
        let mut restored = reloaded(&inner);
        let group = &restored.groups["m"];
        assert_eq!(restored.stale_groups, 1);
        assert_eq!(group.get(Kind::Published).unwrap().type_index, 0);
        assert_eq!(group.get(Kind::Draft).unwrap().type_index, 1);
        assert_eq!(restored.value(group.get(Kind::Draft).unwrap()).unwrap()["title"], "Mixed draft");
        // Each type's pass confirms and ends with its own documents only.
        for type_index in [0, 1] {
            restored.types[type_index as usize].pass = 1;
        }
        assert!(!restored.check_listed("m", "r1", 1, false));
        restored.end_pass(0, 1, 0);
        assert!(!restored.check_listed("drafts.m", "d1", 1, false));
        restored.end_pass(1, 1, 0);
        assert_eq!(restored.groups["m"].docs.len(), 2);
        assert_eq!(restored.stale_groups, 0);
    }

    #[test]
    fn saves_a_type_again_only_when_what_its_record_holds_changed() {
        let mut inner = inner();
        put(&mut inner, json!({"_id": "a", "_type": "author", "_rev": "r1", "name": "a"}));
        let mut restored = reloaded(&inner);
        restored.types[0].dirty = false;
        put(&mut restored, json!({"_id": "a", "_type": "author", "_rev": "r1", "name": "a"}));
        assert!(!restored.types[0].dirty);
        put(&mut restored, json!({"_id": "a", "_type": "author", "_rev": "r2", "name": "a, edited"}));
        assert!(restored.types[0].dirty);
    }

    #[test]
    fn fetches_new_documents_of_a_type_held_in_part_only_for_groups_known_whole() {
        let mut inner = inner();
        for id in ["a", "b"] {
            put(&mut inner, json!({"_id": id, "_type": "author", "_rev": "r1", "name": id}));
        }
        inner.groups.get_mut("b").unwrap().known = true;
        let mut restored = reloaded(&inner);
        restored.types[0].pass = 1;
        // A warm-up stopped at the budget reached `a` but not its draft: a row showing `a` fetches
        // its group whole, so the pass does not.
        assert!(!restored.check_listed("drafts.a", "d1", 1, false));
        assert!(restored.check_listed("drafts.b", "d1", 1, false));
        assert!(restored.check_listed("a", "r2", 1, false));
        assert!(!restored.check_listed("z", "r1", 1, false));
        assert!(restored.check_listed("z", "r1", 1, true));
    }
}
