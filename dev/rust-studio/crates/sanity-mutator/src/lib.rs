//! Port of `@sanity/mutator`: patch paths, patch operations, mutations and the optimistic
//! document layer.

pub mod mutation;
pub mod optimistic;
pub mod patch;
pub mod path;

pub use mutation::Mutation;
pub use optimistic::{OptimisticDocuments, RemoteMutation, Transaction, TransactionState};
pub use patch::{InsertPosition, Operation, PatchOp};
pub use path::{Path, Segment};
