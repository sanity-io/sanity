//! The optimistic document layer, the role `BufferedDocument` plays in `@sanity/mutator`: local
//! transactions apply on top of the last snapshot the server sent, so edits show immediately and
//! survive remote changes arriving in between ("rebasing"), until the listener echoes them back.
//!
//! Strings get more care than in `@sanity/mutator`. Every `set` of an existing string is sent as
//! a `diffMatchPatch`, as `SquashingBuffer` does, but the layer also keeps what each patch is meant
//! to do (the string it was made from and the one it makes), and uses that instead of the
//! patch's fuzzy matching wherever it can:
//!
//! - Locally, an edit applies to a string someone else changed by a three-way merge
//!   ([`dmp::merge`]) that keeps every character either side inserted, where a patch whose
//!   context was edited would fail and drop the edit.
//! - A queued patch is made again from the rebased string whenever the snapshot moves, so its
//!   context matches what Content Lake has when it arrives.
//! - When the listener echoes a transaction, the result is compared with what the merge intended,
//!   and a string Content Lake patched differently (a patch whose context had changed again in the
//!   meantime) gets a corrective patch, so no edit is lost.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::dmp;
use crate::mutation::Mutation;
use crate::patch::{self, Operation, PatchOp};
use crate::path::{self, Path, Segment};

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
    /// The string edit each mutation makes, for those that patch a string.
    texts: Vec<Option<TextEdit>>,
    /// Whether the next `set` of the string the last mutation edits replaces that mutation, the
    /// role of `SquashingBuffer`'s staged set operations. A remote change to the document ends it,
    /// so an edit after one is a patch from the rebased string, never one that reverts it.
    squash: bool,
}

/// What a string patch is meant to do: turn `base`, the string it was made from, into `value`
/// by `edits`, which say which characters it deletes and where it inserts, so merging it into a
/// string someone else edited never mistakes their text for its own.
#[derive(Clone, Debug, PartialEq)]
struct TextEdit {
    path: Path,
    base: String,
    value: String,
    edits: dmp::Edits,
}

impl TextEdit {
    fn new(path: Path, base: String, value: String) -> TextEdit {
        let edits = dmp::Edits::between(&base, &value);
        TextEdit { path, base, value, edits }
    }

    /// The string this edit makes of `current`, the string at its path now.
    fn applied_to(&self, current: &str) -> String {
        if current == self.base { self.value.clone() } else { dmp::merge_edits(&self.base, &self.edits, current).0 }
    }

    fn mutation(&self, id: &str) -> Mutation {
        let op = match self.edits.patch(&self.base) {
            Some(patch) => PatchOp::diff_match_patch(self.path.clone(), patch),
            // A diff that splits a surrogate pair, which the JS library refuses to stringify too
            None => PatchOp::set(self.path.clone(), Value::String(self.value.clone())),
        };
        Mutation::patch(id, vec![op])
    }
}

impl Transaction {
    fn new(id: String, state: TransactionState) -> Transaction {
        Transaction {
            id,
            mutations: Vec::new(),
            state,
            pending: BTreeSet::new(),
            uncertain: BTreeSet::new(),
            committed_at: 0,
            timestamp: String::new(),
            texts: Vec::new(),
            squash: false,
        }
    }

    pub fn documents(&self) -> impl Iterator<Item = &str> {
        self.pending.iter().map(String::as_str)
    }

    fn push(&mut self, mutation: Mutation, text: Option<TextEdit>) {
        self.mutations.push(mutation);
        self.texts.push(text);
    }

    fn remove(&mut self, index: usize) {
        self.mutations.remove(index);
        self.texts.remove(index);
    }

    /// Queues a `set` of the string at `path`, `old` before it. While squashing, it replaces the
    /// last mutation with one patch from that one's base, as long as the two differ in one place:
    /// diff-match-patch merges edits a few characters apart into one replacement, which would
    /// delete whatever someone else typed between them, so typing somewhere else starts a new one.
    fn queue_text(&mut self, id: &str, path: Path, old: String, new: String) {
        if self.squash
            && let Some(last) = self.mutations.len().checked_sub(1)
            && self.mutations[last].document_id() == id
            && let Some(edit) = &self.texts[last]
            && edit.path == path
            && dmp::is_single_edit(&edit.base, &new)
        {
            let base = edit.base.clone();
            if base == new {
                self.remove(last);
                self.squash = false;
            } else {
                let edit = TextEdit::new(path, base, new);
                self.mutations[last] = edit.mutation(id);
                self.texts[last] = Some(edit);
            }
            return;
        }
        if old != new {
            let edit = TextEdit::new(path, old, new);
            self.push(edit.mutation(id), Some(edit));
            self.squash = true;
        }
    }

    /// Applies the mutations for `id` to `doc`, string edits by merging.
    fn apply(&self, id: &str, mut doc: Option<Value>) -> Option<Value> {
        for (mutation, text) in self.mutations.iter().zip(&self.texts).filter(|(m, _)| m.document_id() == id) {
            doc = apply_mutation(doc, mutation, text.as_ref());
        }
        doc
    }
}

fn apply_mutation(doc: Option<Value>, mutation: &Mutation, text: Option<&TextEdit>) -> Option<Value> {
    let Some(edit) = text else { return mutation.apply(doc) };
    let mut doc = doc;
    if let Some(doc) = doc.as_mut()
        && let Some(current) = string_at(doc, &edit.path)
    {
        // A string that is gone (its block deleted, say) stays gone, like a patch of it would
        let next = edit.applied_to(current);
        patch::apply(doc, &[PatchOp::set(edit.path.clone(), Value::String(next))]);
    }
    doc
}

/// A mutation event from the listener, reduced to what the layer needs.
#[derive(Clone, Debug, Default)]
pub struct RemoteMutation {
    pub document_id: String,
    pub transaction_id: String,
    /// The document after the transaction, `None` when it was deleted.
    pub result: Option<Value>,
    /// The revision the transaction applied to, which tells whether the snapshot is the document
    /// it changed.
    pub previous_rev: Option<String>,
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
            doc = tx.apply(id, doc);
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
        self.rebase_queued(id);
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

    /// Adds mutations to the queued transaction, opening one when there is none.
    ///
    /// A `set` of a string that already exists becomes a `diffMatchPatch` from the string the
    /// user saw, so applying it to a string someone else changed in the meantime keeps their
    /// edit. A `set` that changes nothing is dropped, and setting the same path again replaces the
    /// queued write instead of growing the transaction. Patches with several operations are
    /// queued as one mutation per operation, which is how they are sent anyway.
    pub fn queue(&mut self, mutations: Vec<Mutation>, new_id: impl FnOnce() -> String, timestamp: String) {
        if !self.transactions.last().is_some_and(|tx| tx.state == TransactionState::Queued) {
            self.transactions.push(Transaction::new(new_id(), TransactionState::Queued));
        }
        let last = self.transactions.len() - 1;
        self.transactions[last].timestamp = timestamp;
        let split = mutations.into_iter().flat_map(|mutation| match mutation {
            Mutation::Patch { id, ops } if ops.len() > 1 => {
                ops.into_iter().map(|op| Mutation::patch(id.clone(), vec![op])).collect()
            }
            other => vec![other],
        });
        for mutation in split {
            let id = mutation.document_id().to_owned();
            let current = self.local(&id);
            let tx = &mut self.transactions[last];
            if let Mutation::Patch { ops, .. } = &mutation
                && let [PatchOp { path, op: Operation::Set(new) }] = ops.as_slice()
                && let Some(old) = current.as_ref().and_then(|doc| value_at(doc, path))
            {
                match (old, new) {
                    (Value::String(old), Value::String(new)) => {
                        tx.queue_text(&id, path.clone(), old.clone(), new.clone());
                        continue;
                    }
                    (old, new) if old == new && !new.is_object() && !new.is_array() => continue,
                    _ => {}
                }
            }
            tx.squash = false;
            if let Some(index) = squash_target(&tx.mutations, &mutation) {
                tx.mutations[index] = mutation;
                tx.texts[index] = None;
            } else {
                tx.push(mutation, None);
            }
        }
        let tx = &mut self.transactions[last];
        tx.pending = tx.mutations.iter().map(|m| m.document_id().to_owned()).collect();
        if tx.mutations.is_empty() {
            self.transactions.pop();
        }
    }

    /// Makes the queued string patches of `id` again from the strings they now apply to, after
    /// its snapshot moved, so they reach Content Lake with context that matches.
    fn rebase_queued(&mut self, id: &str) {
        let Some(first) = self.transactions.iter().position(|tx| tx.state == TransactionState::Queued) else {
            return;
        };
        let mut doc = self.remote(id).cloned();
        for tx in self.transactions[..first].iter().filter(|tx| tx.pending.contains(id)) {
            doc = tx.apply(id, doc);
        }
        for tx in &mut self.transactions[first..] {
            tx.squash = false;
            let mut i = 0;
            while i < tx.mutations.len() {
                if tx.mutations[i].document_id() != id {
                    i += 1;
                    continue;
                }
                if let Some(edit) = &tx.texts[i]
                    && let Some(current) = doc.as_ref().and_then(|doc| string_at(doc, &edit.path))
                    && current != edit.base
                {
                    let (merged, edits) = dmp::merge_edits(&edit.base, &edit.edits, current);
                    if merged == current {
                        tx.remove(i);
                        continue;
                    }
                    let edit = TextEdit { path: edit.path.clone(), base: current.to_owned(), value: merged, edits };
                    tx.mutations[i] = edit.mutation(id);
                    tx.texts[i] = Some(edit);
                }
                doc = apply_mutation(doc, &tx.mutations[i], tx.texts[i].as_ref());
                i += 1;
            }
            tx.pending = tx.mutations.iter().map(|m| m.document_id().to_owned()).collect();
        }
        self.transactions.retain(|tx| tx.state != TransactionState::Queued || !tx.mutations.is_empty());
    }

    /// Marks the queued transaction as sent and returns it, unless one is already in flight:
    /// transactions are sent one at a time so they reach Content Lake in order.
    pub fn take_next(&mut self) -> Option<Transaction> {
        if self.transactions.iter().any(|tx| tx.state == TransactionState::InFlight) {
            return None;
        }
        let tx = self.transactions.iter_mut().find(|tx| tx.state == TransactionState::Queued)?;
        tx.state = TransactionState::InFlight;
        tx.squash = false;
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
        let tx = self.transactions.remove(index);
        for id in &tx.pending {
            self.rebase_queued(id);
        }
        Some(tx)
    }

    /// Applies a listener event: the snapshot moves forward, and when the event is the echo of
    /// a local transaction, it and every transaction sent before it stop applying to the document.
    /// A string the echoed transaction edited that Content Lake patched differently from the
    /// local merge is corrected by a transaction queued ahead of the others.
    pub fn receive(&mut self, event: RemoteMutation) {
        let corrections = self.corrections(&event);
        let id = event.document_id.clone();
        self.remote.insert(id.clone(), event.result);
        self.settle(&id, &event.transaction_id);
        if let Some((edits, timestamp)) = corrections {
            let mut tx = Transaction::new(format!("{}-fix", event.transaction_id), TransactionState::Queued);
            tx.timestamp = timestamp;
            for edit in edits {
                tx.push(edit.mutation(&id), Some(edit));
            }
            tx.pending.insert(id.clone());
            let at = self.transactions.iter().position(|tx| tx.state == TransactionState::Queued);
            self.transactions.insert(at.unwrap_or(self.transactions.len()), tx);
        }
        self.rebase_queued(&id);
        self.prune();
    }

    /// The strings `event`, the echo of a sent local transaction, left different from what the
    /// transaction's edits merged into the document it applied to would be, as edits from the
    /// echoed string to the intended one, with the transaction's timestamp. Only checked when the
    /// snapshot is that document.
    fn corrections(&self, event: &RemoteMutation) -> Option<(Vec<TextEdit>, String)> {
        let id = event.document_id.as_str();
        let tx = self.transactions.iter().find(|tx| {
            tx.id == event.transaction_id && tx.state != TransactionState::Queued && tx.pending.contains(id)
        })?;
        let (previous, result) = (self.remote(id)?, event.result.as_ref()?);
        if event.previous_rev.is_none() || previous.get("_rev").and_then(Value::as_str) != event.previous_rev.as_deref()
        {
            return None;
        }
        let intended = tx.apply(id, Some(previous.clone()));
        let mut paths: Vec<&Path> = Vec::new();
        for edit in
            tx.texts.iter().zip(&tx.mutations).filter(|(_, m)| m.document_id() == id).filter_map(|(t, _)| t.as_ref())
        {
            if !paths.contains(&&edit.path) {
                paths.push(&edit.path);
            }
        }
        let edits: Vec<TextEdit> = paths
            .into_iter()
            .filter_map(|path| {
                let want = string_at(intended.as_ref()?, path)?;
                let got = string_at(result, path)?;
                let edits = dmp::Edits::correcting(string_at(previous, path)?, got, want);
                (!same_characters(want, got)).then(|| TextEdit {
                    path: path.clone(),
                    base: got.to_owned(),
                    value: want.to_owned(),
                    edits,
                })
            })
            .collect();
        (!edits.is_empty()).then(|| (edits, tx.timestamp.clone()))
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

/// The value at a path addressing exactly one value.
fn value_at<'a>(doc: &'a Value, path: &[Segment]) -> Option<&'a Value> {
    if path.iter().any(|segment| matches!(segment, Segment::Range(..))) {
        return None;
    }
    path::get(doc, path)
}

fn same_characters(a: &str, b: &str) -> bool {
    let sorted = |s: &str| {
        let mut units = dmp::utf16(s);
        units.sort_unstable();
        units
    };
    a.len() == b.len() && sorted(a) == sorted(b)
}

fn string_at<'a>(doc: &'a Value, path: &[Segment]) -> Option<&'a str> {
    value_at(doc, path)?.as_str()
}

/// The index of a queued single-operation `set`/`unset` on the same document and path as
/// `next`, which `next` can replace without changing the outcome. An unset array item is never
/// replaced: the items after it move up, so its index then addresses another item, and a keyed
/// one is gone.
fn squash_target(queued: &[Mutation], next: &Mutation) -> Option<usize> {
    let Mutation::Patch { id, ops } = next else { return None };
    let [PatchOp { path, op: Operation::Set(_) | Operation::Unset }] = ops.as_slice() else {
        return None;
    };
    let last = queued.len().checked_sub(1)?;
    match &queued[last] {
        Mutation::Patch { id: last_id, ops: last_ops }
            if last_id == id
                && matches!(
                    last_ops.as_slice(),
                    [PatchOp { path: last_path, op }] if last_path == path && match op {
                        Operation::Set(_) => true,
                        Operation::Unset => matches!(path.last(), Some(Segment::Attr(_))),
                        _ => false,
                    }
                ) =>
        {
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
            previous_rev: None,
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
            previous_rev: None,
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
            previous_rev: None,
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

    fn dmp(id: &str, path: &str, old: &str, new: &str) -> Mutation {
        Mutation::patch(
            id,
            vec![PatchOp::diff_match_patch(parse(path).unwrap(), dmp::make_patch_string(old, new).unwrap())],
        )
    }

    #[test]
    fn queued_sets_on_the_same_path_squash() {
        let mut store = store_with("a", json!({"_id": "a", "n": 0}));
        let mut ids = 0;
        for n in [1, 2, 3] {
            store.queue(
                vec![set("a", "n", json!(n))],
                || {
                    ids += 1;
                    format!("tx{ids}")
                },
                "t".into(),
            );
        }
        assert_eq!(store.transactions().len(), 1);
        assert_eq!(store.transactions()[0].mutations, vec![set("a", "n", json!(3))]);

        // Once a transaction is in flight, new edits open the next one
        store.take_next();
        store.queue(vec![set("a", "n", json!(4))], || "tx2".into(), "t".into());
        assert_eq!(store.transactions().len(), 2);
        assert_eq!(store.local("a").unwrap()["n"], 4);
    }

    #[test]
    fn string_sets_become_one_patch_from_the_string_before_them() {
        let mut store = store_with("a", json!({"_id": "a", "title": "Hello"}));
        for text in ["Hello ", "Hello w", "Hello wo"] {
            store.queue(vec![set("a", "title", json!(text))], || "tx".into(), "t".into());
        }
        assert_eq!(store.transactions()[0].mutations, vec![dmp("a", "title", "Hello", "Hello wo")]);
        assert_eq!(store.local("a").unwrap()["title"], "Hello wo");
        // Typing back to where it started leaves nothing to send
        store.queue(vec![set("a", "title", json!("Hello"))], || "tx".into(), "t".into());
        assert!(store.transactions().is_empty());
        assert!(!store.has_local_changes("a"));
        // A field without a string yet is set
        store.queue(vec![set("a", "subtitle", json!("S"))], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations, vec![set("a", "subtitle", json!("S"))]);
    }

    #[test]
    fn sets_that_change_nothing_are_dropped() {
        let mut store = store_with("a", json!({"_id": "a", "title": "x", "body": "y"}));
        let both = Mutation::patch(
            "a",
            vec![PatchOp::set(parse("title").unwrap(), json!("x")), PatchOp::set(parse("body").unwrap(), json!("yz"))],
        );
        store.queue(vec![both], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations, vec![dmp("a", "body", "y", "yz")]);
        store.queue(vec![set("a", "title", json!("x"))], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations.len(), 1);
    }

    #[test]
    fn remote_edits_to_the_same_string_survive_local_typing() {
        let mut store = store_with("a", json!({"_id": "a", "title": "The quick brown fox"}));
        store.queue(vec![set("a", "title", json!("The quick brown fox jumps"))], || "tx".into(), "t".into());
        store.receive(RemoteMutation {
            document_id: "a".into(),
            transaction_id: "other".into(),
            result: Some(json!({"_id": "a", "title": "The very quick brown fox"})),
            previous_rev: None,
        });
        assert_eq!(store.local("a").unwrap()["title"], "The very quick brown fox jumps");
        // The queued patch is made again from the rebased string, and the input shows the merged
        // text, so the next keystroke is a patch from it. Squashing it into the first patch would
        // diff from a string without "very " and insert it again.
        store.queue(vec![set("a", "title", json!("The very quick brown fox jumps!"))], || "tx".into(), "t".into());
        assert_eq!(
            store.transactions()[0].mutations,
            vec![
                dmp("a", "title", "The very quick brown fox", "The very quick brown fox jumps"),
                dmp("a", "title", "The very quick brown fox jumps", "The very quick brown fox jumps!"),
            ]
        );
        assert_eq!(store.local("a").unwrap()["title"], "The very quick brown fox jumps!");
    }

    /// A deterministic xorshift generator, so a failing interleaving reproduces.
    struct Rng(u64);

    impl Rng {
        fn next(&mut self) -> u64 {
            self.0 ^= self.0 << 13;
            self.0 ^= self.0 >> 7;
            self.0 ^= self.0 << 17;
            self.0
        }

        fn below(&mut self, n: usize) -> usize {
            (self.next() % n as u64) as usize
        }
    }

    /// Content Lake for one document: applies transactions in the order they arrive, with the
    /// same patch semantics (diff-match-patch's fuzzy matching included), and sends every result
    /// to each client's listener.
    struct Lake {
        doc: Value,
    }

    impl Lake {
        fn commit(&mut self, tx: &Transaction, clients: &mut [Client]) {
            let mut doc = Some(self.doc.clone());
            for mutation in &tx.mutations {
                for wire in mutation.to_json() {
                    doc = Mutation::from_json(&wire).unwrap().apply(doc);
                }
            }
            let previous_rev = self.doc["_rev"].as_str().map(str::to_owned);
            self.doc = doc.unwrap();
            self.doc["_rev"] = json!(tx.id);
            for client in clients {
                client.listener.push_back(RemoteMutation {
                    document_id: "a".into(),
                    transaction_id: tx.id.clone(),
                    result: Some(self.doc.clone()),
                    previous_rev: previous_rev.clone(),
                });
            }
        }
    }

    struct Client {
        name: &'static str,
        docs: OptimisticDocuments,
        listener: std::collections::VecDeque<RemoteMutation>,
        acks: std::collections::VecDeque<String>,
        transactions: usize,
        typed: Vec<String>,
        /// The caret and what is left to type of the current word.
        typing: Option<(usize, String)>,
        region: Region,
    }

    /// Where a client starts its words, relative to a word of the original text.
    #[derive(Clone, Copy)]
    enum Region {
        Anywhere,
        LeftOf(&'static str),
        RightOf(&'static str),
    }

    impl Region {
        fn allows(self, text: &str, at: usize) -> bool {
            match self {
                Region::Anywhere => true,
                Region::LeftOf(word) => at <= text.find(word).unwrap(),
                Region::RightOf(word) => at > text.find(word).unwrap(),
            }
        }
    }

    impl Client {
        fn text(&self, path: &Path) -> String {
            string_at(&self.docs.local("a").unwrap(), path).unwrap().to_owned()
        }

        /// Types up to three characters at the caret, starting a word and a space at a word
        /// boundary when the last one is done.
        fn type_some(&mut self, path: &Path, rng: &mut Rng) {
            for _ in 0..=rng.below(3) {
                let text = self.text(path);
                let (caret, rest) = self.typing.take().unwrap_or_else(|| {
                    let boundaries: Vec<usize> = (0..=text.len())
                        .filter(|&at| (at == 0 || text.as_bytes()[at - 1] == b' ') && self.region.allows(&text, at))
                        .collect();
                    let word = format!("{}{}", self.name, self.typed.len());
                    self.typed.push(word.clone());
                    (boundaries[rng.below(boundaries.len())], format!("{word} "))
                });
                let (next, rest) = rest.split_at(1);
                let value = format!("{}{next}{}", &text[..caret], &text[caret..]);
                self.transactions += 1;
                let id = format!("{}{}", self.name, self.transactions);
                self.docs.queue(
                    vec![Mutation::patch("a", vec![PatchOp::set(path.clone(), json!(value))])],
                    || id,
                    "t".into(),
                );
                if !rest.is_empty() {
                    self.typing = Some((caret + 1, rest.to_owned()));
                }
            }
        }

        /// Receives a listener event and moves the caret through the change it makes, like an
        /// input does.
        fn receive(&mut self, path: &Path, event: RemoteMutation) {
            let before = self.text(path);
            self.docs.receive(event);
            let after = self.text(path);
            if let Some((caret, _)) = &mut self.typing {
                *caret = dmp::map_caret(&before, &after, *caret);
            }
        }
    }

    /// Two clients type into the same string while Content Lake applies their transactions in
    /// the order they arrive and the listener delivers each result to both, with
    /// acknowledgements and echoes arriving in any order and arbitrarily late. Every character
    /// either client typed must end up in the document exactly once, the original text must
    /// survive in order, and both clients must converge on the document. Returns how many typed
    /// words ended up in one piece and how many were typed.
    fn simulate_concurrent_typing(seed: u64, path: &str, initial: Value, regions: [Region; 2]) -> (usize, usize) {
        let path = parse(path).unwrap();
        let original = string_at(&initial, &path).unwrap().to_owned();
        let mut rng = Rng(seed);
        let mut lake = Lake { doc: initial.clone() };
        let mut clients = [("A", regions[0]), ("B", regions[1])].map(|(name, region)| Client {
            name,
            docs: store_with("a", initial.clone()),
            listener: Default::default(),
            acks: Default::default(),
            transactions: 0,
            typed: Vec::new(),
            typing: None,
            region,
        });
        let commit = |clients: &mut [Client; 2], lake: &mut Lake, c: usize| {
            let Some(tx) = clients[c].docs.take_next() else { return };
            lake.commit(&tx, clients);
            clients[c].acks.push_back(tx.id);
        };
        for _ in 0..1200 {
            let c = rng.below(2);
            match rng.below(20) {
                0..=8 => clients[c].type_some(&path, &mut rng),
                9..=11 => commit(&mut clients, &mut lake, c),
                12..=17 => {
                    if let Some(event) = clients[c].listener.pop_front() {
                        clients[c].receive(&path, event);
                    }
                }
                _ => {
                    if let Some(id) = clients[c].acks.pop_front() {
                        clients[c].docs.commit_succeeded(&id);
                    }
                }
            }
        }
        for client in &mut clients {
            while client.typing.is_some() {
                client.type_some(&path, &mut rng);
            }
        }
        while clients.iter().any(|c| !c.docs.transactions().is_empty() || !c.listener.is_empty()) {
            for c in 0..2 {
                commit(&mut clients, &mut lake, c);
                while let Some(event) = clients[c].listener.pop_front() {
                    clients[c].receive(&path, event);
                }
                while let Some(id) = clients[c].acks.pop_front() {
                    clients[c].docs.commit_succeeded(&id);
                }
            }
        }
        let text = string_at(&lake.doc, &path).unwrap();
        for client in &clients {
            assert_eq!(
                client.docs.local("a").as_ref(),
                Some(&lake.doc),
                "seed {seed}: client {} converged",
                client.name
            );
        }
        let typed: Vec<&str> = clients.iter().flat_map(|c| &c.typed).map(String::as_str).collect();
        assert!(typed.len() > 100, "the run types enough to interleave");
        let mut expected: Vec<char> =
            original.chars().chain(typed.iter().flat_map(|w| w.chars().chain([' ']))).collect();
        let mut got: Vec<char> = text.chars().collect();
        expected.sort_unstable();
        got.sort_unstable();
        assert!(got == expected, "seed {seed}: every typed character is in {text:?} exactly once");
        let mut rest = text.chars();
        assert!(original.chars().all(|c| rest.any(|x| x == c)), "seed {seed}: {original:?} survives in {text:?}");
        let words: BTreeMap<&str, usize> = text.split(' ').fold(BTreeMap::new(), |mut words, word| {
            *words.entry(word).or_default() += 1;
            words
        });
        (typed.iter().filter(|w| words.get(*w) == Some(&1)).count(), typed.len())
    }

    const STRING: &str = "Collaborative editing";
    const SPAN: &str = "Two people, one paragraph.";

    fn string_doc() -> Value {
        json!({"_id": "a", "_rev": "r0", "title": STRING})
    }

    fn span_doc() -> Value {
        json!({"_id": "a", "_rev": "r0", "body": [{
            "_key": "b1",
            "_type": "block",
            "children": [{"_key": "s1", "_type": "span", "marks": [], "text": SPAN}],
        }]})
    }

    const SPAN_PATH: &str = "body[_key==\"b1\"].children[_key==\"s1\"].text";

    /// Clients typing in different places of the text never disturb each other's words.
    #[test]
    fn concurrent_typing_in_different_places_keeps_every_word_whole() {
        for seed in 1..=10 {
            for (path, doc, word) in [("title", string_doc(), "Collaborative"), (SPAN_PATH, span_doc(), "one")] {
                let (whole, typed) =
                    simulate_concurrent_typing(seed, path, doc, [Region::LeftOf(word), Region::RightOf(word)]);
                assert_eq!(whole, typed, "seed {seed}: every word typed into {path} is whole");
            }
        }
    }

    /// Clients typing at random places of the same string lose nothing. When both start a word
    /// in the same gap at the same moment, the characters of the two words can interleave there,
    /// since neither client knows what the other one types until Content Lake has applied it.
    #[test]
    fn concurrent_typing_in_one_string_loses_nothing() {
        let (mut whole, mut typed) = (0, 0);
        for seed in 1..=20 {
            let (w, t) = simulate_concurrent_typing(seed, "title", string_doc(), [Region::Anywhere; 2]);
            (whole, typed) = (whole + w, typed + t);
        }
        assert!(whole * 100 >= typed * 98, "{whole} of {typed} words are whole");
    }

    #[test]
    fn concurrent_typing_in_one_portable_text_span_loses_nothing() {
        let (mut whole, mut typed) = (0, 0);
        for seed in 1..=20 {
            let (w, t) = simulate_concurrent_typing(seed, SPAN_PATH, span_doc(), [Region::Anywhere; 2]);
            (whole, typed) = (whole + w, typed + t);
        }
        assert!(whole * 100 >= typed * 98, "{whole} of {typed} words are whole");
    }

    #[test]
    fn unset_array_items_are_not_squashed() {
        let unset = |path: &str| Mutation::patch("a", vec![PatchOp::unset(parse(path).unwrap())]);
        let mut store = store_with("a", json!({"_id": "a", "tags": ["x", "y", "z"], "title": "T"}));
        // Removing the first item twice removes two items
        store.queue(vec![unset("tags[0]")], || "tx".into(), "t".into());
        store.queue(vec![unset("tags[0]")], || "tx".into(), "t".into());
        assert_eq!(store.local("a").unwrap()["tags"], json!(["z"]));
        // Editing the item that moved into a removed one's place edits that item
        let mut store = store_with("a", json!({"_id": "a", "tags": ["x", "y", "z"], "title": "T"}));
        store.queue(vec![unset("tags[0]")], || "tx".into(), "t".into());
        store.queue(vec![set("a", "tags[0]", json!("Y"))], || "tx".into(), "t".into());
        assert_eq!(store.local("a").unwrap()["tags"], json!(["Y", "z"]));
        // Fields still squash
        store.queue(vec![unset("title")], || "tx".into(), "t".into());
        store.queue(vec![set("a", "title", json!("U"))], || "tx".into(), "t".into());
        assert_eq!(store.transactions()[0].mutations.len(), 3);
        assert_eq!(store.local("a").unwrap()["title"], "U");
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
            previous_rev: None,
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
            previous_rev: None,
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
