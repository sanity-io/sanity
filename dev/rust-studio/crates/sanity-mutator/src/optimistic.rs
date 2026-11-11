//! The optimistic document layer, the role `BufferedDocument` plays in `@sanity/mutator`: local
//! transactions apply on top of the last snapshot the server sent, so edits show immediately and
//! survive remote changes arriving in between ("rebasing"), until the listener echoes them back.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::mutation::Mutation;
use crate::patch::{Operation, PatchOp};
use crate::path::Segment;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TransactionState {
    /// Still collecting mutations; the next commit sends it.
    Queued,
    InFlight,
    /// Acknowledged by `/data/mutate`, waiting for the listener to echo it per document.
    Committed,
}

#[derive(Clone, Debug)]
pub struct Transaction {
    pub id: String,
    pub mutations: Vec<Mutation>,
    pub state: TransactionState,
    /// Documents whose listener echo has not arrived; the transaction only applies to these.
    pending: BTreeSet<String>,
    /// Pending documents a snapshot arrived for while the transaction was in flight, written by
    /// neither it nor a later transaction. The server may have applied it already (and someone
    /// written after it) or not, which only a snapshot fetched after the commit can tell.
    uncertain: BTreeSet<String>,
    /// The [`OptimisticDocuments::commit_count`] its commit made, 0 until then.
    committed_at: u64,
    /// Applied locally as `_updatedAt` so lists sorted by it reorder immediately.
    pub timestamp: String,
}

impl Transaction {
    pub fn documents(&self) -> impl Iterator<Item = &str> {
        self.pending.iter().map(String::as_str)
    }
}

/// A mutation event from the listener, reduced to what the layer needs.
#[derive(Clone, Debug, Default)]
pub struct RemoteMutation {
    pub document_id: String,
    pub transaction_id: String,
    /// The document after the transaction, `None` when it was deleted.
    pub result: Option<Value>,
}

#[derive(Default)]
pub struct OptimisticDocuments {
    /// `None` is a document known not to exist; a missing entry is one never loaded.
    remote: BTreeMap<String, Option<Value>>,
    transactions: Vec<Transaction>,
    commits: u64,
}

impl OptimisticDocuments {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_loaded(&self, id: &str) -> bool {
        self.remote.contains_key(id)
    }

    pub fn remote(&self, id: &str) -> Option<&Value> {
        self.remote.get(id).and_then(Option::as_ref)
    }

    /// The document as the user sees it: the remote snapshot with every unechoed transaction
    /// that touches it applied in order.
    pub fn local(&self, id: &str) -> Option<Value> {
        let mut doc = self.remote(id).cloned();
        for tx in self.transactions.iter().filter(|tx| tx.pending.contains(id)) {
            let before = doc.clone();
            for mutation in tx.mutations.iter().filter(|m| m.document_id() == id) {
                doc = mutation.apply(doc);
            }
            if doc != before
                && let Some(Value::Object(map)) = doc.as_mut()
            {
                map.insert("_updatedAt".into(), Value::String(tx.timestamp.clone()));
            }
        }
        doc
    }

    pub fn has_local_changes(&self, id: &str) -> bool {
        self.transactions.iter().any(|tx| tx.pending.contains(id))
    }

    pub fn transactions(&self) -> &[Transaction] {
        &self.transactions
    }

    /// Ids of every document with unechoed local changes.
    pub fn dirty_documents(&self) -> BTreeSet<String> {
        self.transactions.iter().flat_map(|tx| tx.pending.iter().cloned()).collect()
    }

    /// How many commits have returned. A snapshot fetch notes it when it starts, for
    /// `set_snapshot`.
    pub fn commit_count(&self) -> u64 {
        self.commits
    }

    /// Stores a snapshot whose fetch started at `commits` (see `commit_count`) and returns
    /// whether the document needs fetching again.
    ///
    /// The snapshot's `_rev` is the id of the transaction that last wrote the document, so when
    /// that is a local one, it and every transaction sent before it stop applying. A transaction
    /// committed before the fetch started is in the snapshot too, since the doc endpoint reads its
    /// own writes, and stops applying. One sent but not committed by then may or may not be in
    /// it, eg when someone wrote after it, so it keeps applying, and the document is fetched again
    /// once that transaction is committed: right away when it is by now, otherwise when
    /// `commit_succeeded` returns the document.
    pub fn set_snapshot(&mut self, id: &str, doc: Option<Value>, commits: u64) -> bool {
        let rev = doc.as_ref().and_then(|doc| doc.get("_rev")).and_then(Value::as_str).map(str::to_owned);
        self.remote.insert(id.to_owned(), doc);
        if let Some(rev) = rev {
            self.settle(id, &rev);
        }
        let mut refetch = false;
        for tx in self.transactions.iter_mut().filter(|tx| tx.pending.contains(id)) {
            match tx.state {
                TransactionState::Committed if tx.committed_at <= commits => {
                    tx.pending.remove(id);
                }
                TransactionState::Committed => refetch = true,
                TransactionState::InFlight => {
                    tx.uncertain.insert(id.to_owned());
                }
                TransactionState::Queued => {}
            }
        }
        self.prune();
        refetch
    }

    /// Stops `transaction_id` and every transaction sent before it from applying to `id`: they
    /// reach Content Lake in order, so a document it wrote contains the earlier ones.
    fn settle(&mut self, id: &str, transaction_id: &str) {
        if let Some(index) = self.transactions.iter().position(|tx| tx.id == transaction_id) {
            for tx in &mut self.transactions[..=index] {
                tx.pending.remove(id);
            }
        }
    }

    /// Adds mutations to the queued transaction, opening one when there is none. Setting the
    /// same path again replaces the queued write instead of growing the transaction.
    pub fn queue(&mut self, mutations: Vec<Mutation>, new_id: impl FnOnce() -> String, timestamp: String) {
        let tx = match self.transactions.last_mut() {
            Some(tx) if tx.state == TransactionState::Queued => tx,
            _ => {
                self.transactions.push(Transaction {
                    id: new_id(),
                    mutations: Vec::new(),
                    state: TransactionState::Queued,
                    pending: BTreeSet::new(),
                    uncertain: BTreeSet::new(),
                    committed_at: 0,
                    timestamp: String::new(),
                });
                self.transactions.last_mut().unwrap()
            }
        };
        tx.timestamp = timestamp;
        for mutation in mutations {
            tx.pending.insert(mutation.document_id().to_owned());
            if let Some(previous) = squash_target(&mut tx.mutations, &mutation) {
                *previous = mutation;
            } else {
                tx.mutations.push(mutation);
            }
        }
    }

    /// Marks the queued transaction as sent and returns it, unless one is already in flight:
    /// transactions are sent one at a time so they reach Content Lake in order.
    pub fn take_next(&mut self) -> Option<Transaction> {
        if self.transactions.iter().any(|tx| tx.state == TransactionState::InFlight) {
            return None;
        }
        let tx = self.transactions.iter_mut().find(|tx| tx.state == TransactionState::Queued)?;
        tx.state = TransactionState::InFlight;
        Some(tx.clone())
    }

    pub fn has_queued(&self) -> bool {
        self.transactions.iter().any(|tx| tx.state == TransactionState::Queued)
    }

    /// Marks a transaction as acknowledged and returns the documents to fetch again, those a
    /// snapshot left uncertain while it was in flight (see `set_snapshot`).
    pub fn commit_succeeded(&mut self, transaction_id: &str) -> Vec<String> {
        let mut refetch = Vec::new();
        if let Some(tx) = self.transactions.iter_mut().find(|tx| tx.id == transaction_id) {
            self.commits += 1;
            tx.state = TransactionState::Committed;
            tx.committed_at = self.commits;
            refetch = std::mem::take(&mut tx.uncertain).into_iter().filter(|id| tx.pending.contains(id)).collect();
        }
        self.prune();
        refetch
    }

    /// Drops a rejected transaction, reverting its changes locally, and returns it.
    pub fn commit_failed(&mut self, transaction_id: &str) -> Option<Transaction> {
        let index = self.transactions.iter().position(|tx| tx.id == transaction_id)?;
        Some(self.transactions.remove(index))
    }

    /// Applies a listener event: the snapshot moves forward, and when the event is the echo of
    /// a local transaction, it and every transaction sent before it stop applying to the document.
    pub fn receive(&mut self, event: RemoteMutation) {
        self.remote.insert(event.document_id.clone(), event.result);
        self.settle(&event.document_id, &event.transaction_id);
        self.prune();
    }

    /// Forgets everything about documents without local changes, keeping the rest, eg when a
    /// listener reconnects and snapshots need to be fetched again.
    pub fn forget_clean(&mut self) -> Vec<String> {
        let dirty = self.dirty_documents();
        let forgotten: Vec<String> = self.remote.keys().filter(|id| !dirty.contains(*id)).cloned().collect();
        for id in &forgotten {
            self.remote.remove(id);
        }
        forgotten
    }

    /// Forgets the snapshot of `id` unless it has local changes, eg when nothing listens to it
    /// any more and the snapshot would go stale.
    pub fn forget_if_clean(&mut self, id: &str) -> bool {
        if self.has_local_changes(id) {
            return false;
        }
        self.remote.remove(id).is_some()
    }

    pub fn has_in_flight(&self) -> bool {
        self.transactions.iter().any(|tx| tx.state == TransactionState::InFlight)
    }

    fn prune(&mut self) {
        self.transactions.retain(|tx| {
            tx.state == TransactionState::Queued || tx.state == TransactionState::InFlight || !tx.pending.is_empty()
        });
    }
}

/// A queued single-operation `set`/`unset` on the same document and path as `next`, which
/// `next` can replace without changing the outcome.
fn squash_target<'a>(queued: &'a mut [Mutation], next: &Mutation) -> Option<&'a mut Mutation> {
    let Mutation::Patch { id, ops } = next else { return None };
    let [PatchOp { path, op }] = ops.as_slice() else {
        return None;
    };
    if !matches!(op, Operation::Set(_) | Operation::Unset) {
        return None;
    }
    // Index paths address by position. An unset shifts later items, so a later set/unset at the
    // same index targets a different element and must not replace the queued op.
    let index_path = path.iter().any(|segment| matches!(segment, Segment::Index(_)));
    if index_path && matches!(op, Operation::Unset) {
        return None;
    }
    let last = queued.last_mut()?;
    match last {
        Mutation::Patch { id: last_id, ops: last_ops } if last_id == id => {
            let [PatchOp { path: last_path, op: last_op }] = last_ops.as_slice() else {
                return None;
            };
            if last_path != path || !matches!(last_op, Operation::Set(_) | Operation::Unset) {
                return None;
            }
            if index_path && matches!(last_op, Operation::Unset) {
                return None;
            }
            Some(last)
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::path::parse;

    fn set(id: &str, path: &str, value: Value) -> Mutation {
        Mutation::patch(id, vec![PatchOp::set(parse(path).unwrap(), value)])
    }

    fn unset(id: &str, path: &str) -> Mutation {
        Mutation::patch(id, vec![PatchOp::unset(parse(path).unwrap())])
    }

    /// Stores a snapshot whose fetch started just now.
    fn fetched(store: &mut OptimisticDocuments, id: &str, doc: Option<Value>) -> bool {
        let commits = store.commit_count();
        store.set_snapshot(id, doc, commits)
    }

    fn store_with(id: &str, doc: Value) -> OptimisticDocuments {
        let mut store = OptimisticDocuments::new();
        fetched(&mut store, id, Some(doc));
        store
    }

    #[test]
    fn local_edits_apply_on_top_of_remote_changes() {
        let mut store = store_with("a", json!({"_id": "a", "title": "x", "n": 1}));
        store.queue(vec![set("a", "title", json!("local"))], || "tx1".into(), "t1".into());
        assert_eq!(store.local("a").unwrap()["title"], "local");
        assert_eq!(store.local("a").unwrap()["_updatedAt"], "t1");

        // Someone else changes another field while ours is unsent
        store.receive(RemoteMutation {
            document_id: "a".into(),
            transaction_id: "other".into(),
            result: Some(json!({"_id": "a", "title": "x", "n": 2})),
        });
        let local = store.local("a").unwrap();
        assert_eq!((local["title"].clone(), local["n"].clone()), (json!("local"), json!(2)));
    }

    #[test]
    fn transactions_stop_applying_per_document_when_echoed() {
        let mut store = store_with("a", json!({"_id": "a"}));
        fetched(&mut store, "b", Some(json!({"_id": "b"})));
        store.queue(vec![set("a", "x", json!(1)), set("b", "x", json!(1))], || "tx".into(), "t".into());
        let tx = store.take_next().unwrap();
        assert_eq!(tx.documents().collect::<Vec<_>>(), ["a", "b"]);
        assert!(store.take_next().is_none());

        store.receive(RemoteMutation {
            document_id: "a".into(),
            transaction_id: "tx".into(),
            result: Some(json!({"_id": "a", "x": 1})),
        });
        assert!(!store.has_local_changes("a"));
        // b's echo has not arrived, so the transaction still applies there
        assert_eq!(store.local("b").unwrap()["x"], 1);
        store.commit_succeeded("tx");
        assert_eq!(store.transactions().len(), 1);
        store.receive(RemoteMutation {
            document_id: "b".into(),
            transaction_id: "tx".into(),
            result: Some(json!({"_id": "b", "x": 1})),
        });
        assert!(store.transactions().is_empty());
    }

    #[test]
    fn rejected_transactions_revert() {
        let mut store = store_with("a", json!({"_id": "a", "title": "x"}));
        store.queue(vec![set("a", "title", json!("y"))], || "tx".into(), "t".into());
        store.take_next();
        store.commit_failed("tx");
        assert_eq!(store.local("a").unwrap()["title"], "x");
    }

    #[test]
    fn forgets_only_clean_snapshots() {
        let mut store = store_with("a", json!({"_id": "a"}));
        fetched(&mut store, "b", Some(json!({"_id": "b"})));
        store.queue(vec![set("a", "x", json!(1))], || "tx".into(), "t".into());
        assert!(!store.forget_if_clean("a"));
        assert!(store.forget_if_clean("b"));
        assert!(store.is_loaded("a") && !store.is_loaded("b"));
        assert!(!store.has_in_flight());
        store.take_next();
        assert!(store.has_in_flight());
    }

    #[test]
    fn queued_sets_on_the_same_path_squash() {
        let mut store = store_with("a", json!({"_id": "a"}));
        let mut ids = 0;
        for text in ["H", "He", "Hel"] {
            store.queue(
                vec![set("a", "title", json!(text))],
                || {
                    ids += 1;
                    format!("tx{ids}")
                },
                "t".into(),
            );
        }
        assert_eq!(store.transactions().len(), 1);
        assert_eq!(store.transactions()[0].mutations, vec![set("a", "title", json!("Hel"))]);

        // Once a transaction is in flight, new edits open the next one
        store.take_next();
        store.queue(vec![set("a", "title", json!("Hell"))], || "tx2".into(), "t".into());
        assert_eq!(store.transactions().len(), 2);
        assert_eq!(store.local("a").unwrap()["title"], "Hell");
    }

    #[test]
    fn index_unsets_do_not_squash_across_shifted_items() {
        let mut store = store_with("a", json!({"_id": "a", "tags": ["a", "b", "c"]}));
        // Removing index 0 shifts "b" into tags[0]; a second delete of the new first item must
        // compose, not replace the queued unset.
        store.queue(vec![unset("a", "tags[0]")], || "tx".into(), "t".into());
        store.queue(vec![unset("a", "tags[0]")], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations, vec![unset("a", "tags[0]"), unset("a", "tags[0]")]);
        assert_eq!(store.local("a").unwrap()["tags"], json!(["c"]));

        // An edit of the item that shifted into the index must not replace a prior unset either.
        let mut store = store_with("a", json!({"_id": "a", "tags": ["a", "b"]}));
        store.queue(vec![unset("a", "tags[0]")], || "tx".into(), "t".into());
        store.queue(vec![set("a", "tags[0]", json!("B"))], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations, vec![unset("a", "tags[0]"), set("a", "tags[0]", json!("B"))]);
        assert_eq!(store.local("a").unwrap()["tags"], json!(["B"]));

        // Consecutive sets at the same index still squash (typing into one slot).
        let mut store = store_with("a", json!({"_id": "a", "tags": ["x"]}));
        store.queue(vec![set("a", "tags[0]", json!("y"))], || "tx".into(), "t".into());
        store.queue(vec![set("a", "tags[0]", json!("z"))], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations, vec![set("a", "tags[0]", json!("z"))]);
    }

    #[test]
    fn snapshots_supersede_committed_transactions() {
        let mut store = store_with("a", json!({"_id": "a", "list": []}));
        let insert = Mutation::patch(
            "a",
            vec![PatchOp::insert(crate::InsertPosition::After, parse("list[-1]").unwrap(), vec![json!({"_key": "k"})])],
        );
        store.queue(vec![insert], || "tx".into(), "t".into());
        store.take_next();
        store.commit_succeeded("tx");
        // The listener reconnected and missed the echo; the refetched snapshot has the insert
        fetched(&mut store, "a", Some(json!({"_id": "a", "list": [{"_key": "k"}]})));
        assert_eq!(store.local("a").unwrap()["list"], json!([{"_key": "k"}]));
    }

    fn insert_item(id: &str, key: &str) -> Mutation {
        Mutation::patch(
            id,
            vec![PatchOp::insert(crate::InsertPosition::After, parse("list[-1]").unwrap(), vec![json!({"_key": key})])],
        )
    }

    #[test]
    fn snapshots_written_by_an_in_flight_transaction_settle_it() {
        let mut store = store_with("a", json!({"_id": "a", "_rev": "r0", "list": []}));
        store.queue(vec![insert_item("a", "k")], || "tx".into(), "t".into());
        store.take_next();
        // The listener reconnected after the server applied the insert, before the commit returned
        fetched(&mut store, "a", Some(json!({"_id": "a", "_rev": "tx", "list": [{"_key": "k"}]})));
        assert_eq!(store.local("a").unwrap()["list"], json!([{"_key": "k"}]));
        assert!(!store.has_local_changes("a"));
        assert!(store.commit_succeeded("tx").is_empty());
    }

    #[test]
    fn uncertain_in_flight_documents_are_fetched_again_after_the_commit() {
        let mut store = store_with("a", json!({"_id": "a", "_rev": "r0", "list": []}));
        store.queue(vec![insert_item("a", "k")], || "tx".into(), "t".into());
        store.take_next();
        // Someone else wrote after the insert, so the snapshot's revision is not ours
        fetched(&mut store, "a", Some(json!({"_id": "a", "_rev": "r1", "list": [{"_key": "k"}], "n": 1})));
        assert_eq!(store.commit_succeeded("tx"), ["a"]);
        fetched(&mut store, "a", Some(json!({"_id": "a", "_rev": "r1", "list": [{"_key": "k"}], "n": 1})));
        assert_eq!(store.local("a").unwrap()["list"], json!([{"_key": "k"}]));
        assert!(store.transactions().is_empty());
    }

    #[test]
    fn snapshots_from_before_an_in_flight_transaction_keep_it_applying() {
        let mut store = store_with("a", json!({"_id": "a", "_rev": "r0", "list": []}));
        store.queue(vec![insert_item("a", "k")], || "tx".into(), "t".into());
        store.take_next();
        fetched(&mut store, "a", Some(json!({"_id": "a", "_rev": "r0", "list": []})));
        assert_eq!(store.local("a").unwrap()["list"], json!([{"_key": "k"}]));
        // The echo arrives on the reconnected listener before the commit returns
        store.receive(RemoteMutation {
            document_id: "a".into(),
            transaction_id: "tx".into(),
            result: Some(json!({"_id": "a", "_rev": "tx", "list": [{"_key": "k"}]})),
        });
        assert!(store.commit_succeeded("tx").is_empty());
        assert_eq!(store.local("a").unwrap()["list"], json!([{"_key": "k"}]));
    }

    #[test]
    fn snapshots_fetched_before_a_commit_keep_it_applying() {
        let mut store = OptimisticDocuments::new();
        fetched(&mut store, "drafts.a", None);
        store.queue(vec![Mutation::Create(json!({"_id": "drafts.a", "_type": "t"}))], || "tx".into(), "t".into());
        store.take_next();
        // The new document's pane fetches its snapshot while the create is in flight, and the
        // commit returns before the snapshot does
        let commits = store.commit_count();
        assert!(store.commit_succeeded("tx").is_empty());
        assert!(store.set_snapshot("drafts.a", None, commits));
        assert_eq!(store.local("drafts.a").unwrap()["_type"], "t");
        // The snapshot fetched again sees the create
        assert!(!fetched(&mut store, "drafts.a", Some(json!({"_id": "drafts.a", "_type": "t", "_rev": "tx"}))));
        assert!(store.transactions().is_empty());
    }

    #[test]
    fn echoes_settle_the_transactions_sent_before_them() {
        let mut store = store_with("a", json!({"_id": "a", "list": []}));
        store.queue(vec![insert_item("a", "k1")], || "tx1".into(), "t".into());
        store.take_next();
        store.commit_succeeded("tx1");
        store.queue(vec![insert_item("a", "k2")], || "tx2".into(), "t".into());
        store.take_next();
        // The echo of tx1 was missed while the listener reconnected
        store.receive(RemoteMutation {
            document_id: "a".into(),
            transaction_id: "tx2".into(),
            result: Some(json!({"_id": "a", "list": [{"_key": "k1"}, {"_key": "k2"}]})),
        });
        assert_eq!(store.local("a").unwrap()["list"], json!([{"_key": "k1"}, {"_key": "k2"}]));
        assert!(!store.has_local_changes("a"));
    }

    #[test]
    fn drafts_are_created_from_published() {
        let mut store = store_with("a", json!({"_id": "a", "_type": "t", "title": "pub"}));
        fetched(&mut store, "drafts.a", None);
        store.queue(
            vec![
                Mutation::CreateIfNotExists(json!({"_id": "drafts.a", "_type": "t", "title": "pub"})),
                set("drafts.a", "title", json!("draft")),
            ],
            || "tx".into(),
            "t".into(),
        );
        assert_eq!(store.local("drafts.a").unwrap()["title"], "draft");
        assert_eq!(store.local("a").unwrap()["title"], "pub");
        assert_eq!(store.dirty_documents().into_iter().collect::<Vec<_>>(), ["drafts.a"]);
    }
}
