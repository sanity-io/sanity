---
source: stories/beta/PaneDrivenBanners.stories.tsx
title: 'Document Banners/Pane-driven'
blocks: 11
roundtrip: true
sourceHash: b421acf77ee713c7
---

<!-- @component -->

Whether a banner appears at all is sometimes the banner's whole job, and these seven decide that by reading the document pane directly, each mounted as itself with the pane supplying its input.

|          |                                                                       |
| -------- | --------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/documentPanel/banners/` |
| Tier     | SERVICE                                                               |
| Patterns | `visible-system-state`                                                |
| Coverage | eight plain data fields across all seven banners                      |

These seven were originally left out on the reasoning that stubbing `useDocumentPane` would story the appearance while discarding the decision. That reasoning was borrowed from `DocumentPane` itself, where the pane genuinely is the subject, and it does not transfer. Look at what these actually read: `revisionNotFound` is a boolean. `schemaType` is schema data. `isDeleted` / `isDeleting` / `ready` are three flags. The `if (!revisionNotFound) return null` that decides whether a banner appears is the banner's code, not the pane's, so handing it a flag and watching it decide tests exactly the thing being storied.

Every pane field the stub does not carry is one a banner could read tomorrow and get `undefined` for, passing here while crashing in a real studio. `lib/documentPaneStub.tsx` therefore lists its fields explicitly rather than casting a partial object, and anything reaching past the eight belongs in the live-pane stories instead.

Also storied: each banner's negative case. A banner that returns `null` is doing its main job, and an empty dashed frame is the only honest way to show it.

> **Why it matters:** stub a dependency the component reads as input; refuse when the thing stubbed is what the story tests. The same hook falls on both sides depending on the consumer, so the call is made per component rather than per hook.

<!-- @story RevisionNotFound -->

A URL points at a revision the history no longer holds - usually a link shared after the history window rolled past it. The banner is caution-toned rather than critical, correctly: nothing is broken, you are simply looking at the current document instead of the one you asked for.

<!-- @story RevisionFound -->

The flag is false, so the banner returns `null` before rendering anything. This is the state it is in on every document you ever open. The interesting property of this component is that it is almost always invisible.

<!-- @story NotDeprecated -->

`isDeprecatedSchemaType(schemaType)` is false, so nothing renders. Worth showing next to the story above: the two differ only in one property on the schema type, and no prop distinguishes them.

<!-- @story Deleted -->

The document was deleted while you had it open - usually by someone else, in another tab or another session. The pane stays mounted with its content, and the banner is what tells you that content no longer exists anywhere but on your screen.

This is the collaboration case a single-user mental model misses entirely, and the reason the component reads three flags rather than one.

<!-- @story Deleting -->

Mid-delete, and **nothing renders**. The condition is `isDeleted && !isDeleting`, so the banner deliberately holds its tongue while the operation is in flight and only speaks once it has landed.

That is a better decision than it first looks. A delete can fail. Announcing "this document has been deleted" while the request is still outstanding would be a claim the studio cannot yet support, and retracting it a second later is worse than never making it. The banner waits for the fact.

Storied because I got it backwards first: the story originally expected a mid-delete banner and found an empty frame, which is how the guard came to light.

<!-- @story NotDeleted -->

The ordinary case. Note the third flag: the component also checks `ready`, so it stays silent while the pane is still resolving rather than flashing "deleted" at a document that simply has not loaded yet. That guard is the difference between a correct banner and an alarming one.

<!-- @story Unpublished -->

Not what the name suggests. This banner is not about a document that has never been published - it fires when the release you are currently viewing is going to **unpublish** this document, which it detects from `_system.delete` on the version.

So the message is a warning about the future rather than a note about the past: the content in front of you is live now and will not be after this release goes out. It names the release inline via `VersionInlineBadge`, and it is critical-toned, which for a banner family that is mostly caution is the strongest signal available.

My first fixture here gave it a draft and no published version and got an empty frame, which is how the actual condition came to light.

<!-- @story InsufficientPermission -->

You can see this document and cannot change it. `requiredPermission` is a genuine prop rather than a pane read, so the same banner covers "cannot update" and "cannot create" with the right verb.

Where the workspace enables ask-to-edit, it also offers to request access inline - the same pattern as `RequestPermissionDialog`: an error that ends in an action rather than a wall.

<!-- @story CanvasLinked -->

**Nothing renders here, and that is the story.** `CanvasLinkedBanner` resolves a companion document through the Canvas store; with no companion - the ordinary case for a document nobody linked - it returns null.

The linked state needs a live Canvas companion-doc store, which is a genuine connection rather than a data field, so it stays out of this page under the same rule that keeps the Presentation iframe out. What is pinned here is the negative: a document with no Canvas link shows no Canvas banner, on every document you will ever open.

<!-- @story Stacked -->

Three conditions true simultaneously - a deleted document, of a deprecated type, at a revision that no longer exists. Each banner decides independently and all three appear.

Nothing in the system ranks or collapses them, which is fine at three and a real question at six.
