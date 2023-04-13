# @sanity/diff: Tools for diffing data structures

`@sanity/diff` is a library for calculating and presenting _diffs_ of content.

## Concepts and architecture

- The main data structure is `Diff` which represents a difference between two versions. This is a
  nested data structure so if it's an `ObjectDiff`, then its children will have `Diff` as well.

  The `Diff` is built on top of the _unchanged_, _added_ and _removed_ primitives. This means that
  it will contain both versions at the same time and it's always trivial to recreate the old/new
  version (by ignoring the added/removed parts of the diff).

  Note that for arrays and objects, unchanged/added/removed only have a "shallow" meaning. An
  `ObjectDiff` will have a _unchanged field_ if the field was present in both the old and new
  version - regardless of whether there's any internal changes.

- `Diff` also supports _annotations_. These contain information about when a change was introduced
  and who was responsible for it.

- To construct a `Diff` you need to represent the versions as `Input` types and use `diffInput(from,to)`
  to create the diff. The primary reason for a separate `Input` type is to support passing along
  annotations. In addition, this allows us to optimize based on the object equality of the inputs.

- There are multiple ways of _presenting_ a diff: Sometimes you want to only show the fields that
  has changed, and other times you want to show the full new (or old!) document interspersed with the
  changes.

  This library does _not_ contain any UI components, but instead provides various
  presentation-related helper functions.
