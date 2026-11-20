//! A key-value store in IndexedDB, for the replica to outlive the page: one database per project
//! and dataset, one object store with string keys. Every operation runs in a transaction of its
//! own and resolves once it committed, so callers can yield to the main thread between them;
//! where IndexedDB is unavailable (some private windows) every operation is a no-op.

use std::cell::{Cell, RefCell};

use js_sys::{Array, Function, Promise};
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{JsFuture, future_to_promise};
use web_sys::{IdbDatabase, IdbKeyRange, IdbObjectStore, IdbRequest, IdbTransaction, IdbTransactionMode};

use crate::config;

const STORE: &str = "replica";

fn database_name() -> String {
    format!("sanity-rust-studio:{}:{}", config::PROJECT_ID, config::DATASET)
}

/// Resolves with the request's result, or rejects with its error.
fn request(request: &IdbRequest) -> JsFuture {
    let promise = Promise::new(&mut |resolve: Function, reject: Function| {
        let done = request.clone();
        let failed = request.clone();
        let on_success = Closure::once_into_js(move || {
            let _ = resolve.call1(&JsValue::UNDEFINED, &done.result().unwrap_or(JsValue::UNDEFINED));
        });
        let on_error = Closure::once_into_js(move || {
            let error = failed.error().ok().flatten().map(JsValue::from).unwrap_or(JsValue::NULL);
            let _ = reject.call1(&JsValue::UNDEFINED, &error);
        });
        request.set_onsuccess(Some(on_success.unchecked_ref()));
        request.set_onerror(Some(on_error.unchecked_ref()));
    });
    JsFuture::from(promise)
}

/// Resolves once the transaction committed, or rejects when it failed or was aborted.
fn committed(transaction: &IdbTransaction) -> JsFuture {
    let promise = Promise::new(&mut |resolve: Function, reject: Function| {
        let on_complete = Closure::once_into_js(move || {
            let _ = resolve.call0(&JsValue::UNDEFINED);
        });
        // A failed transaction fires `error` and then `abort`, and a once closure runs once.
        let rejecter = |reject: Function| {
            Closure::once_into_js(move || {
                let _ = reject.call0(&JsValue::UNDEFINED);
            })
        };
        transaction.set_oncomplete(Some(on_complete.unchecked_ref()));
        transaction.set_onerror(Some(rejecter(reject.clone()).unchecked_ref()));
        transaction.set_onabort(Some(rejecter(reject).unchecked_ref()));
    });
    JsFuture::from(promise)
}

/// The keys starting with `prefix`.
fn prefix_range(prefix: &str) -> Option<IdbKeyRange> {
    IdbKeyRange::bound(&prefix.into(), &format!("{prefix}\u{ffff}").into()).ok()
}

#[derive(Clone)]
pub struct Db {
    db: IdbDatabase,
}

/// A write: `Put` a value, or `Delete` every key in a range.
pub enum Write {
    Put(String, JsValue),
    Delete(IdbKeyRange),
}

impl Write {
    /// Deletes the keys starting with `prefix`, except those starting with `keep`.
    pub fn delete_prefix_except(prefix: &str, keep: &str) -> Vec<Write> {
        let end = format!("{prefix}\u{ffff}");
        let keep_end = format!("{keep}\u{ffff}");
        [
            IdbKeyRange::bound_with_lower_open_and_upper_open(&prefix.into(), &keep.into(), false, true),
            IdbKeyRange::bound_with_lower_open_and_upper_open(&keep_end.into(), &end.into(), true, false),
        ]
        .into_iter()
        .filter_map(Result::ok)
        .map(Write::Delete)
        .collect()
    }

    pub fn delete_prefix(prefix: &str) -> Option<Write> {
        prefix_range(prefix).map(Write::Delete)
    }

    pub fn delete(key: &str) -> Option<Write> {
        IdbKeyRange::only(&key.into()).ok().map(Write::Delete)
    }
}

pub async fn open() -> Option<Db> {
    let factory = web_sys::window()?.indexed_db().ok()??;
    let open = factory.open_with_u32(&database_name(), 1).ok()?;
    let on_upgrade = Closure::once_into_js({
        let open = open.clone();
        move || {
            if let Some(db) = open.result().ok().and_then(|db| db.dyn_into::<IdbDatabase>().ok()) {
                let _ = db.create_object_store(STORE);
            }
        }
    });
    open.set_onupgradeneeded(Some(on_upgrade.unchecked_ref()));
    let db = request(&open).await.ok()?.dyn_into::<IdbDatabase>().ok()?;
    Some(Db { db })
}

impl Db {
    fn store(&self, mode: IdbTransactionMode) -> Option<(IdbTransaction, IdbObjectStore)> {
        let transaction = self.db.transaction_with_str_and_mode(STORE, mode).ok()?;
        let store = transaction.object_store(STORE).ok()?;
        Some((transaction, store))
    }

    /// Every entry, in two requests. The values are byte arrays and strings, which deserialize as
    /// copies, so this is quick; a cursor's round trip per entry took longer than decoding them.
    pub async fn entries(&self) -> Vec<(String, JsValue)> {
        let Some((_transaction, store)) = self.store(IdbTransactionMode::Readonly) else { return Vec::new() };
        let (Ok(keys), Ok(values)) = (store.get_all_keys(), store.get_all()) else { return Vec::new() };
        let (Ok(keys), Ok(values)) = (request(&keys).await, request(&values).await) else { return Vec::new() };
        Array::from(&keys)
            .iter()
            .zip(Array::from(&values).iter())
            .filter_map(|(key, value)| Some((key.as_string()?, value)))
            .collect()
    }

    /// Applies `writes` in one transaction; true once it committed.
    pub async fn write(&self, writes: Vec<Write>) -> bool {
        if FORGOTTEN.get() {
            return false;
        }
        let Some((transaction, store)) = self.store(IdbTransactionMode::Readwrite) else { return false };
        let done = committed(&transaction);
        for write in writes {
            let queued = match &write {
                Write::Put(key, value) => store.put_with_key(value, &key.into()).is_ok(),
                Write::Delete(range) => store.delete(range).is_ok(),
            };
            if !queued {
                let _ = transaction.abort();
                break;
            }
        }
        done.await.is_ok()
    }

    pub async fn clear(&self) -> bool {
        let Some((transaction, store)) = self.store(IdbTransactionMode::Readwrite) else { return false };
        let done = committed(&transaction);
        if store.clear().is_err() {
            return false;
        }
        done.await.is_ok()
    }
}

thread_local! {
    static PRELOAD: RefCell<Option<Promise>> = const { RefCell::new(None) };
    static FORGOTTEN: Cell<bool> = const { Cell::new(false) };
}

/// Deletes everything and refuses writes for the rest of the page's life, so a save still in
/// flight, or the one the page saves while it unloads, cannot bring the data back.
pub async fn forget() {
    FORGOTTEN.set(true);
    if let Some(db) = open().await {
        db.clear().await;
    }
}

/// Starts reading every entry, before the user is known, so the replica restores as soon as
/// they are: resolves with an array of `[key, value]` pairs, empty without IndexedDB.
pub fn preload() {
    PRELOAD.with(|preload| {
        preload.borrow_mut().get_or_insert_with(|| {
            future_to_promise(async {
                let entries = Array::new();
                if let Some(db) = open().await {
                    for (key, value) in db.entries().await {
                        entries.push(&Array::of2(&key.into(), &value));
                    }
                }
                Ok(entries.into())
            })
        });
    });
}

/// The preloaded entries, once; later calls get none.
pub async fn take_preloaded() -> Vec<(String, JsValue)> {
    preload();
    let Some(promise) = PRELOAD.with(|preload| preload.borrow().clone()) else { return Vec::new() };
    let Ok(entries) = JsFuture::from(promise).await else { return Vec::new() };
    PRELOAD.with(|preload| *preload.borrow_mut() = Some(Promise::resolve(&JsValue::from(Array::new()))));
    Array::from(&entries)
        .iter()
        .filter_map(|entry| {
            let entry = Array::from(&entry);
            Some((entry.get(0).as_string()?, entry.get(1)))
        })
        .collect()
}
