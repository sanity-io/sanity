# Variants events review

## Creating a draft variant and publishing it

DocumentGroupId: 5987ad0a-ae10-4c91-a9a8-a05d24308c7a
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;5987ad0a-ae10-4c91-a9a8-a05d24308c7a)

Repro steps:

- Create a variant document with scope id `N1b8v1OrykW4hnjB`.3
- Update the variant document.
- Publish it, variant with scope id `3GF1PTF5I1zOuWnb` is created by this publish action.

### Viewing it from the draft variant

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.N1b8v1OrykW4hnjB.5987ad0a-ae10-4c91-a9a8-a05d24308c7a?limit=10&tag=sanity.studio.get-document-events) (draft variant)

```ts
const events = [deleteDocumentVersion, createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/drafts.5987ad0a-ae10-4c91-a9a8-a05d24308c7a?limit=10&tag=sanity.studio.get-document-events) (draft default)

```ts
const events = [publishDocumentVersion, createDocumentVersion]
```

### Viewing it from the published variant

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.3GF1PTF5I1zOuWnb.5987ad0a-ae10-4c91-a9a8-a05d24308c7a?limit=100&tag=sanity.studio.get-document-events) (Published variant)

```ts
const events = [createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/5987ad0a-ae10-4c91-a9a8-a05d24308c7a?limit=100&tag=sanity.studio.get-document-events) (Published default)

```ts
const events = [publishDocumentVersion]
```

## Publishing over a published variant

DocumentGroupId: 921811dc-a055-4fdb-8e35-56028734fa78
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;921811dc-a055-4fdb-8e35-56028734fa78)

Repro steps:

- Create a variant document
- Update the variant document
- Publish it.
- Create the draft and update it.
- Publish it again.

### Viewing it from the draft variant

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.N1b8v1OrykW4hnjB.921811dc-a055-4fdb-8e35-56028734fa78?limit=10&tag=sanity.studio.get-document-events) (Draft variant)

```ts
const events = [
  deleteDocumentVersion,
  createDocumentVersion,
  deleteDocumentVersion,
  createDocumentVersion,
]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/drafts.921811dc-a055-4fdb-8e35-56028734fa78?limit=100&tag=sanity.studio.get-document-events) (Draft default)

```ts
const events = [
  publishDocumentVersion,
  createDocumentVersion,
  publishDocumentVersion,
  createDocumentVersion,
]
```

### Viewing it from the published variant

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.3GF1PTF5I1zOuWnb.921811dc-a055-4fdb-8e35-56028734fa78?limit=100&tag=sanity.studio.get-document-events) (Published variant)

```ts
const events = [createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/921811dc-a055-4fdb-8e35-56028734fa78?limit=100&tag=sanity.studio.get-document-events) (Published default)

```ts
const events = [publishDocumentVersion, publishDocumentVersion]
```

## Unpublishing a published variant

DocumentGroupId: 82ccc7f3-fa85-46dd-83d0-e3cd7f08d55e
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;82ccc7f3-fa85-46dd-83d0-e3cd7f08d55e)

Repro steps:

- Create a variant document.
- Update the variant document.
- Publish it
- Unpublish the published variant, the draft is created again with an incorrect event.

### Studio to fix when unpublishing

The studio needs a way to access to the published variant document id. See [https://sanity-io.slack.com/archives/C0B09157WTF/p1787749235493019](https://sanity-io.slack.com/archives/C0B09157WTF/p1787749235493019)

### Viewing it from the draft

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.N1b8v1OrykW4hnjB.82ccc7f3-fa85-46dd-83d0-e3cd7f08d55e?limit=10&tag=sanity.studio.get-document-events) (Draft variant)

```ts
const events = [createDocumentVersion, deleteDocumentVersion, createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/drafts.82ccc7f3-fa85-46dd-83d0-e3cd7f08d55e?limit=10&tag=sanity.studio.get-document-events) (Draft default)

```ts
const events = [unpublishDocumentVersion, publishDocumentVersion, createDocumentVersion]
```

### Viewing it from the published

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.3GF1PTF5I1zOuWnb.82ccc7f3-fa85-46dd-83d0-e3cd7f08d55e?limit=100&tag=sanity.studio.get-document-events) (Published variant)

```ts
const events = [deleteDocumentVersion, createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/82ccc7f3-fa85-46dd-83d0-e3cd7f08d55e?limit=100&tag=sanity.studio.get-document-events) (Published default)

```ts
const events = [unpublishDocument, publishDocumentVersion]
```

## Discarding a draft variant

DocumentGroupId: 4c98cc86-73d5-47f3-84ae-b8ca8361c42b
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;4c98cc86-73d5-47f3-84ae-b8ca8361c42b)

Repro steps:

- Create a variant document
- Update the variant document.
- Discard it.

### Studio to fix when discarding:

Get the draft id for the variant.

### Viewing it from the draft with scope id `N1b8v1OrykW4hnjB`

This works correctly from content lake. ✅

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.N1b8v1OrykW4hnjB.4c98cc86-73d5-47f3-84ae-b8ca8361c42b?limit=10&tag=sanity.studio.get-document-events)

```ts
const events = [deleteDocumentVersion, createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/drafts.4c98cc86-73d5-47f3-84ae-b8ca8361c42b?limit=10&tag=sanity.studio.get-document-events)

```ts
const events = [deleteDocumentVersion, createDocumentVersion]
```

## Deleting a variant

DocumentGroupId: e8a1724f-9df9-4931-a841-9078da12b1dc
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;e8a1724f-9df9-4931-a841-9078da12b1dc)

Repro steps:

- Create a variant document with scope id `N1b8v1OrykW4hnjB`.
- Update the variant document.
- Call delete on the group.

### Studio to fix when deleting:

Get the draft id for the variant.

### Viewing it from the draft with scope id `N1b8v1OrykW4hnjB`

This works correctly from content lake. ✅

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.N1b8v1OrykW4hnjB.e8a1724f-9df9-4931-a841-9078da12b1dc?limit=10&tag=sanity.studio.get-document-events)

```ts
const events = [deleteDocumentVersion, createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/drafts.e8a1724f-9df9-4931-a841-9078da12b1dc?limit=10&tag=sanity.studio.get-document-events)

```ts
const events = [deleteDocumentVersion, createDocumentVersion]
```

## Publishing a variant from a release

### Published document exists

It updates the published doc when publishing the release

DocumentGroupId: b9aa7854-e4e9-4b25-bdd9-7e20ef8f78ed
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;b9aa7854-e4e9-4b25-bdd9-7e20ef8f78ed)

Repro steps:

- Create a release.
- Create a variant, and publish it.
- Take that same variant, add it to the release.
- Publish the release.

#### Viewing it from the published

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.3GF1PTF5I1zOuWnb.b9aa7854-e4e9-4b25-bdd9-7e20ef8f78ed?limit=100&tag=sanity.studio.get-document-events)

```ts
const events = [createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/b9aa7854-e4e9-4b25-bdd9-7e20ef8f78ed?limit=100&tag=sanity.studio.get-document-events)

```ts
const events = [publishDocumentVersion, publishDocumentVersion]
```

The publish event when coming from a release is missing, it is registered as an edit, we don't have edit events, but we are fetching that transaction in the client.

_releaseId_ in the first event is missing, it should have the id `kbDgxp2W6KgjKZhQ` which is the release that was published when updating that document.

### Published document is missing

It creates the published doc when publishing the release

DocumentGroupId: 5ef9aa38-514c-4c1b-bdb1-ad242a063870
[Studio link](https://test-studio.sanity.dev/test/structure/input-ci;textsTest;5ef9aa38-514c-4c1b-bdb1-ad242a063870)

Repro steps:

- Create a release.
- Create a variant.
- Add it to the release.
- Publish the release.

#### Viewing it from the published with scope id `3GF1PTF5I1zOuWnb`

[Current events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/versions.3GF1PTF5I1zOuWnb.5ef9aa38-514c-4c1b-bdb1-ad242a063870?limit=100&tag=sanity.studio.get-document-events)

```ts
const events = [createDocumentVersion]
```

[Expected events](https://ppsg7ml5.api.sanity.io/v2025-02-19/data/history/test/events/documents/5ef9aa38-514c-4c1b-bdb1-ad242a063870?limit=100&tag=sanity.studio.get-document-events)

```ts
const events = [publishDocumentVersion]
```

_releaseId_ in the first event is missing, it should have the id `kbDgxp2W6KgjKZhQ` which is the release that was published when updating that document.

## liveEdit Variant events
