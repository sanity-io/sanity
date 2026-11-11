//! The document store: one listener per open draft/published pair, the optimistic layer from
//! `sanity-mutator` on top of it, and a commit loop that sends local transactions to Content Lake
//! one at a time.
//!
//! The store is thread local, like the theme, so reactive closures (which Leptos requires to be
//! `Send`) can reach it; reactivity comes from a version signal per document that every read
//! tracks and every change bumps.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{Client, ListenEvent, ListenOptions, Listener, sleep};
use sanity_mutator::{Mutation, OptimisticDocuments, PatchOp, RemoteMutation};
use sanity_ui::prelude::Toasts;
use serde_json::{Map, Value, json};

use crate::util::{draft_id, now_ms, published_id, uuid};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SyncState {
    Saved,
    Saving,
    Error,
}

struct Pair {
    refs: usize,
    /// Tells the pair's listener apart from an earlier one, closed while its snapshots loaded.
    session: u64,
    /// Listener events received per document, to tell whether one arrived while a snapshot of
    /// the document was on its way.
    events: HashMap<String, u64>,
    _listener: Listener,
}

pub struct Store {
    client: RefCell<Option<Client>>,
    docs: RefCell<OptimisticDocuments>,
    versions: RefCell<HashMap<String, ArcRwSignal<u64>>>,
    pairs: RefCell<HashMap<String, Pair>>,
    next_session: Cell<u64>,
    /// Transactions sent through the Actions API instead of `/data/mutate`, by transaction id.
    actions: RefCell<HashMap<String, Vec<Value>>>,
    /// Rejected transactions an action is waiting to hear about.
    failed: RefCell<HashSet<String>>,
    /// The initial values of new documents that no edit has created yet, by published id.
    new_documents: RefCell<HashMap<String, Value>>,
    committing: Cell<bool>,
    commit_scheduled: Cell<bool>,
    toasts: Cell<Option<Toasts>>,
    pub sync: ArcRwSignal<SyncState>,
    pub connected: ArcRwSignal<bool>,
    /// Round trip of the last commit, for the performance panel.
    pub last_commit_ms: ArcRwSignal<Option<f64>>,
    /// Time from a listener's first request to its document snapshots, for the performance panel.
    pub last_load_ms: ArcRwSignal<Option<f64>>,
}

thread_local! {
    static STORE: Rc<Store> = Rc::new(Store {
        client: RefCell::new(None),
        docs: RefCell::new(OptimisticDocuments::new()),
        versions: RefCell::new(HashMap::new()),
        pairs: RefCell::new(HashMap::new()),
        next_session: Cell::new(0),
        actions: RefCell::new(HashMap::new()),
        failed: RefCell::new(HashSet::new()),
        new_documents: RefCell::new(HashMap::new()),
        committing: Cell::new(false),
        commit_scheduled: Cell::new(false),
        toasts: Cell::new(None),
        sync: ArcRwSignal::new(SyncState::Saved),
        connected: ArcRwSignal::new(true),
        last_commit_ms: ArcRwSignal::new(None),
        last_load_ms: ArcRwSignal::new(None),
    });
}

pub fn store() -> Rc<Store> {
    STORE.with(Rc::clone)
}

/// Keeps a document pair's listener open; dropping the last guard for a pair closes it.
pub struct PairGuard(String);

impl Drop for PairGuard {
    fn drop(&mut self) {
        store().release(&self.0);
    }
}

fn strip_system_fields(doc: &mut Value, id: &str) {
    if let Value::Object(map) = doc {
        map.insert("_id".into(), id.into());
        for key in ["_rev", "_createdAt", "_updatedAt"] {
            map.remove(key);
        }
    }
}

impl Store {
    pub fn set_client(&self, client: Client, toasts: Toasts) {
        *self.client.borrow_mut() = Some(client);
        self.toasts.set(Some(toasts));
    }

    pub fn client(&self) -> Client {
        self.client.borrow().clone().expect("the client is set before the studio renders")
    }

    pub fn error(&self, title: &str, description: impl Into<String>) {
        if let Some(toasts) = self.toasts.get() {
            toasts.error(title, description.into());
        }
    }

    fn version(&self, id: &str) -> ArcRwSignal<u64> {
        self.versions.borrow_mut().entry(id.to_owned()).or_insert_with(|| ArcRwSignal::new(0)).clone()
    }

    /// Subscribes the current reactive scope to changes of `id`.
    pub fn track(&self, id: &str) {
        self.version(id).track();
    }

    fn bump(&self, id: &str) {
        let signal = self.versions.borrow().get(id).cloned();
        if let Some(signal) = signal {
            signal.update(|version| *version += 1);
        }
    }

    pub fn local(&self, id: &str) -> Option<Value> {
        self.track(id);
        self.docs.borrow().local(id)
    }

    /// The initial value a new document shows until its first edit creates it.
    pub fn initial_value(&self, published: &str) -> Option<Value> {
        self.new_documents.borrow().get(published).cloned()
    }

    pub fn is_loaded(&self, id: &str) -> bool {
        self.track(id);
        self.docs.borrow().is_loaded(id)
    }

    /// Opens the listener for the draft/published pair of `published` unless it is open already.
    pub fn open(&self, published: &str) -> PairGuard {
        let mut pairs = self.pairs.borrow_mut();
        if let Some(pair) = pairs.get_mut(published) {
            pair.refs += 1;
            return PairGuard(published.to_owned());
        }
        let ids = [draft_id(published), published.to_owned()];
        let params = Map::from_iter([("ids".to_owned(), json!(ids))]);
        let options = ListenOptions { include_result: true, tag: "document.pair-listener".into() };
        let started = now_ms();
        let session = self.next_session.get();
        self.next_session.set(session + 1);
        let key = published.to_owned();
        let listener = self.client().listen("*[_id in $ids]", params, options, move |event| {
            store().on_pair_event(&key, session, &ids, event, started);
        });
        pairs.insert(published.to_owned(), Pair { refs: 1, session, events: HashMap::new(), _listener: listener });
        PairGuard(published.to_owned())
    }

    /// How many listener events each of `ids` has had, while the listener from `session` is open.
    fn events_seen(&self, published: &str, session: u64, ids: &[String]) -> Option<Vec<u64>> {
        let pairs = self.pairs.borrow();
        let pair = pairs.get(published).filter(|pair| pair.session == session)?;
        Some(ids.iter().map(|id| pair.events.get(id).copied().unwrap_or(0)).collect())
    }

    /// Fetches the snapshots of `ids` from the pair of `published`. A snapshot applies only while
    /// the listener it was fetched for is open, since nothing would keep it current otherwise,
    /// and only when no event for the document arrived meanwhile: that event may be newer, and
    /// it cannot tell which local transactions the server has applied, so the document is
    /// fetched again, as it is when the optimistic layer asks for that.
    fn load_snapshots(&self, published: String, session: u64, ids: Vec<String>, started: Option<f64>) {
        let Some(seen) = self.events_seen(&published, session, &ids) else { return };
        let commits = self.docs.borrow().commit_count();
        spawn_local(async move {
            let store = store();
            let result = store.client().get_documents(&ids, "document.snapshots").await;
            let Some(now) = store.events_seen(&published, session, &ids) else { return };
            let docs = match result {
                Ok(docs) => docs,
                Err(err) => return store.error("Could not load the document", err.to_string()),
            };
            let mut changed = Vec::new();
            for (((id, doc), seen), now) in ids.into_iter().zip(docs).zip(seen).zip(now) {
                if seen != now {
                    changed.push(id);
                    continue;
                }
                let refetch = store.docs.borrow_mut().set_snapshot(&id, doc, commits);
                store.bump(&id);
                if refetch {
                    changed.push(id);
                }
            }
            if let Some(started) = started {
                store.last_load_ms.set(Some(now_ms() - started));
            }
            if !changed.is_empty() {
                store.load_snapshots(published, session, changed, None);
            }
        });
    }

    /// Fetches the snapshots of `ids` again where their pair is open.
    fn refresh(&self, ids: Vec<String>) {
        for id in ids {
            let published = published_id(&id).to_owned();
            let session = self.pairs.borrow().get(&published).map(|pair| pair.session);
            if let Some(session) = session {
                self.load_snapshots(published, session, vec![id], None);
            }
        }
    }

    fn release(&self, published: &str) {
        let closed = {
            let mut pairs = self.pairs.borrow_mut();
            match pairs.get_mut(published) {
                Some(pair) if pair.refs > 1 => {
                    pair.refs -= 1;
                    None
                }
                Some(_) => pairs.remove(published),
                None => None,
            }
        };
        if closed.is_some() {
            // Without a listener the snapshots would go stale; edits still in flight keep theirs.
            let mut docs = self.docs.borrow_mut();
            docs.forget_if_clean(&draft_id(published));
            docs.forget_if_clean(published);
        }
    }

    fn on_pair_event(&self, published: &str, session: u64, ids: &[String; 2], event: ListenEvent, started: f64) {
        match event {
            ListenEvent::Welcome { reconnected } => {
                self.connected.set(true);
                self.load_snapshots(published.to_owned(), session, ids.to_vec(), (!reconnected).then_some(started));
            }
            ListenEvent::Mutation(event) => {
                let id = event.document_id.clone();
                {
                    let mut pairs = self.pairs.borrow_mut();
                    let Some(pair) = pairs.get_mut(published).filter(|pair| pair.session == session) else { return };
                    *pair.events.entry(id.clone()).or_default() += 1;
                }
                self.docs.borrow_mut().receive(RemoteMutation {
                    document_id: event.document_id,
                    transaction_id: event.transaction_id,
                    result: event.result,
                });
                self.bump(&id);
            }
            ListenEvent::Reconnecting => self.connected.set(false),
            ListenEvent::Error(err) => self.error("The document listener stopped", err.to_string()),
        }
    }

    fn queue(&self, mutations: Vec<Mutation>, transaction_id: Option<String>) {
        let ids: Vec<String> = mutations.iter().map(|mutation| mutation.document_id().to_owned()).collect();
        self.docs.borrow_mut().queue(mutations, || transaction_id.unwrap_or_else(uuid), sanity_client::now_iso());
        for id in &ids {
            self.bump(id);
        }
        self.sync.set(SyncState::Saving);
    }

    /// Applies patch operations to the draft of `published`, creating the draft from the
    /// published document first when there is none.
    pub fn edit(&self, published: &str, type_name: &str, ops: Vec<PatchOp>) {
        let draft = draft_id(published);
        let mut mutations = Vec::with_capacity(2);
        {
            let docs = self.docs.borrow();
            if docs.local(&draft).is_none() {
                let mut base = docs
                    .local(published)
                    .or_else(|| self.initial_value(published))
                    .unwrap_or_else(|| json!({"_type": type_name}));
                strip_system_fields(&mut base, &draft);
                mutations.push(Mutation::CreateIfNotExists(base));
            }
        }
        mutations.push(Mutation::patch(draft, ops));
        self.queue(mutations, None);
        self.schedule_commit(250);
    }

    /// Picks the id of a new document and returns it. Without `initial`, the document shows the
    /// initial value of its type, and nothing is written until the first edit creates the draft
    /// (`edit`), so an abandoned new document leaves no trace.
    pub fn create(&self, type_name: &str, initial: Option<Value>) -> String {
        let published = uuid();
        let draft = draft_id(&published);
        {
            let mut docs = self.docs.borrow_mut();
            let commits = docs.commit_count();
            docs.set_snapshot(&draft, None, commits);
            docs.set_snapshot(&published, None, commits);
        }
        match initial {
            Some(mut doc) => {
                if let Value::Object(map) = &mut doc {
                    map.insert("_id".into(), draft.into());
                    map.insert("_type".into(), type_name.into());
                }
                self.queue(vec![Mutation::Create(doc)], None);
                self.schedule_commit(0);
            }
            None => {
                if let Some(value) = crate::schema::current().initial_document(type_name) {
                    self.new_documents.borrow_mut().insert(published.clone(), value);
                }
            }
        }
        published
    }

    fn schedule_commit(&self, delay: u32) {
        if self.commit_scheduled.replace(true) {
            return;
        }
        spawn_local(async move {
            if delay > 0 {
                sleep(delay).await;
            }
            store().commit_scheduled.set(false);
            commit_loop().await;
        });
    }

    /// Sends everything queued and waits until no transaction is in flight.
    pub async fn flush(&self) {
        loop {
            let busy = {
                let docs = self.docs.borrow();
                docs.has_queued() || docs.has_in_flight()
            };
            if !busy {
                return;
            }
            commit_loop().await;
            sleep(20).await;
        }
    }

    /// Applies `local` optimistically and sends `action` through the Actions API in the same
    /// transaction, after everything queued before it. Resolves to whether it succeeded.
    async fn run_action(&self, action: Value, local: Vec<Mutation>) -> bool {
        self.flush().await;
        let transaction_id = uuid();
        self.actions.borrow_mut().insert(transaction_id.clone(), vec![action]);
        self.queue(local, Some(transaction_id.clone()));
        loop {
            commit_loop().await;
            let sent = self
                .docs
                .borrow()
                .transactions()
                .iter()
                .all(|tx| tx.id != transaction_id || tx.state == sanity_mutator::TransactionState::Committed);
            if sent {
                break;
            }
            sleep(20).await;
        }
        !self.failed.borrow_mut().remove(&transaction_id)
    }

    pub async fn publish(&self, published: &str) -> bool {
        self.flush().await;
        let draft = draft_id(published);
        let Some(mut doc) = self.docs.borrow().local(&draft) else { return false };
        if let Value::Object(map) = &mut doc {
            map.insert("_id".into(), published.into());
            map.remove("_rev");
        }
        let action =
            json!({"actionType": "sanity.action.document.publish", "draftId": draft, "publishedId": published});
        self.run_action(action, vec![Mutation::CreateOrReplace(doc), Mutation::Delete(draft)]).await
    }

    pub async fn discard(&self, published: &str) -> bool {
        let draft = draft_id(published);
        let action = json!({"actionType": "sanity.action.document.discard", "draftId": draft});
        self.run_action(action, vec![Mutation::Delete(draft)]).await
    }

    pub async fn unpublish(&self, published: &str) -> bool {
        self.flush().await;
        let draft = draft_id(published);
        let mut local = Vec::new();
        if let Some(mut doc) = self.docs.borrow().local(published) {
            strip_system_fields(&mut doc, &draft);
            local.push(Mutation::CreateIfNotExists(doc));
        }
        local.push(Mutation::Delete(published.to_owned()));
        let action =
            json!({"actionType": "sanity.action.document.unpublish", "draftId": draft, "publishedId": published});
        self.run_action(action, local).await
    }

    pub async fn delete(&self, published: &str) -> bool {
        let draft = draft_id(published);
        let action =
            json!({"actionType": "sanity.action.document.delete", "publishedId": published, "includeDrafts": [draft]});
        self.run_action(action, vec![Mutation::Delete(draft), Mutation::Delete(published.to_owned())]).await
    }

    /// Copies the current version of a document into a new draft and returns its published id.
    pub fn duplicate(&self, published: &str, type_name: &str) -> Option<String> {
        let source = self.docs.borrow().local(&draft_id(published)).or_else(|| self.docs.borrow().local(published))?;
        let mut copy = source;
        strip_system_fields(&mut copy, "");
        Some(self.create(type_name, Some(copy)))
    }
}

async fn commit_loop() {
    let store = store();
    if store.committing.replace(true) {
        return;
    }
    let mut failed = false;
    loop {
        let next = store.docs.borrow_mut().take_next();
        let Some(tx) = next else { break };
        let client = store.client();
        let started = now_ms();
        let actions = store.actions.borrow_mut().remove(&tx.id);
        let result = match actions {
            Some(actions) => client.actions(actions, &tx.id, "document.commit").await,
            None => {
                let mutations = tx.mutations.iter().flat_map(Mutation::to_json).collect();
                client.mutate(mutations, &tx.id, "document.commit").await
            }
        };
        match result {
            Ok(_) => {
                let refetch = store.docs.borrow_mut().commit_succeeded(&tx.id);
                store.last_commit_ms.set(Some(now_ms() - started));
                store.refresh(refetch);
            }
            Err(err) => {
                failed = true;
                store.failed.borrow_mut().insert(tx.id.clone());
                let reverted = store.docs.borrow_mut().commit_failed(&tx.id);
                if let Some(reverted) = reverted {
                    let ids: Vec<String> = reverted.documents().map(str::to_owned).collect();
                    for id in ids {
                        store.bump(&id);
                    }
                }
                store.error("Could not save your changes", err.to_string());
            }
        }
    }
    store.committing.set(false);
    store.sync.set(if failed { SyncState::Error } else { SyncState::Saved });
}
