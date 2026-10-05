# Collection entry comments

A collection whose entries are separate documents, each edited inline on the collection through `@sanity/sdk-react`. Everything the entry comments need comes from out-of-the-box App SDK hooks.

- An "Entry comments" column beside the collection form lists the open comments on every entry, a section per entry in `entries` order.
- Editors select text in an entry body on the collection and comment on it. The commented text stays highlighted.
- The comments are ordinary Studio comments on the entry. A comment written from the collection shows in Studio's comments panel on the entry's own page, and a comment written there shows in the column.

## The hooks

From `@sanity/sdk-react`:

- `useDocument` reads the inline entry, and the collection's `entries` and each entry's title for the column.
- `useEditDocument` writes the entry title from the inline entry.
- `useCommentThreads` reads each entry's open threads, with their replies.
- `useCommentActions` provides `replyToComment` for Reply and `setCommentStatus` for Resolve.
- `useUser` loads each author's name and avatar, and the name behind a mention.

From `@portabletext/plugin-sdk-value`:

- `SDKValuePlugin` syncs the entry body between `@portabletext/editor` and the entry document.
- `useSDKCommentAuthoring` reports whether the body selection can take a comment, and writes a comment anchored to it with `createInlineComment`.
- `useSDKCommentDecorations` returns range decorations that highlight the text of each open thread.

The kit imports nothing from `sanity` and names no `@beta` SDK type. The comment payload types (`Comment`, `CommentThread`, `CommentsOptions`) are `@beta` in `@sanity/sdk` even though the hooks are `@public`, so the kit derives its types from public hook results, for example `UseCommentThreadsResult['threads'][number]`.

## Files

The kit is `comments/` plus the two entry editor files:

- `comments/EntryCommentsPane.tsx` - the "Entry comments" column, built on `useDocument` and `useCommentThreads`. Also exports `registerInlineEntry` for click-to-jump.
- `comments/CommentThreadRow.tsx` - a thread with Reply, Resolve and Open entry, built on `useCommentActions` and `useUser`.
- `comments/useInlineCommentDraft.tsx` - wraps `useSDKCommentAuthoring` and keeps the selected range while focus is in the composer.
- `comments/SelectionCommentButton.tsx` - the "Comment" button that floats on the body selection.
- `comments/CommentComposer.tsx` - a plain-text composer for replies and body comments. It keeps one comment id across retries, so a retry never duplicates a comment.
- `comments/LoadBoundary.tsx` - `Suspense` plus an error boundary, so a slow or failing SDK read never blanks the column or the form.
- `EntryEditor.tsx` - the inline entry, built on `useDocument` and `useEditDocument`.
- `EntryBodyEditor.tsx` - the inline body editor, built on `SDKValuePlugin` and `useSDKCommentDecorations`.

Everything else is test-studio scaffolding (the form-only tool shell, the dashboard and the sample-collection seed) and is not for copying. The kit reads its two type names from `constants.ts`.

## Requirements

- `@sanity/sdk-react` 2.20.0 or later. The comments hooks first shipped in 2.20.0, with the same signatures as on 3.x. `@portabletext/plugin-sdk-value` raises the floor to 2.20.1 (`^2.20.1 || ^3`). This example runs 2.21.0.
- An SDK provider from the same copy of `@sanity/sdk-react` as the kit. Since `sanity` 6.10.0, Studio mounts a `ResourceProvider` for each workspace from its own `@sanity/sdk-react` dependency, which is 2.x up to 6.11.0 and 3.x from 6.12.0. Once Studio's copy is 3.x, an app on 2.x holds a second copy whose hooks never see Studio's provider, so it needs a `SanityApp` layout of its own. This example runs the 3.x Studio from this repo with the kit on 2.21.0, and `StudioSdkLayout.tsx` is that layout.
- `@portabletext/plugin-sdk-value` ^8.1.11, with its peer `@portabletext/editor` ^8.2.3, as in `dev/test-studio/package.json`. The comment hooks first shipped in 8.1.0.
- Comments v1. Never enable `beta.comments.v2`. SDK 2.21.0 reads comments from the comments addon dataset only, so with v2 on the column would be empty.
- The kit also imports `@sanity/ui`, `@sanity/uuid` and per-icon entry points such as `@sanity/icons/Launch`. On a `@sanity/icons` version without per-icon entry points, import the icons from `@sanity/icons`.

## Adding it to a Studio

1. Switch Studio's own comments off for the collection type, so the collection page has a single comments surface, and leave them on for entries. This example sets `document: {comments: {enabled: ({documentType}) => documentType === ENTRY_TYPE}}` on the workspace. `document.comments` is tagged `@internal`; it is the only setting that turns Studio's comments off per document type.
2. Point the kit at your types and fields. Set `COLLECTION_TYPE` and `ENTRY_TYPE` in `constants.ts`. When the entry body field has a name other than `body`, change it in the `path` passed to `SDKValuePlugin`, `useInlineCommentDraft` and `useSDKCommentDecorations`, and in the `data-entry-field` marker. The kit reads the collection's references from `entries` and the entry title from `title`.
3. Put `<EntryCommentsPane collectionId={...} onOpenEntry={...} />` beside the collection form. It draws its own header and scrolls inside its container. This example renders it as a column in its own tool, and in the structure tool it would be a custom pane or view. `onOpenEntry(entryId, commentId)` belongs to the host too: this example opens the entry with pane params `inspect=sanity/comments` and `comment=<commentId>`, which opens Studio's comments panel on that thread. In the structure tool, an `edit` intent carrying the same two params does the same.
4. Register each inline entry for click-to-jump. On the element that wraps the entry, set `ref={(element) => registerInlineEntry(entryId, element)}`. React 19 calls the returned function as the ref cleanup. Wrap the title input in `data-entry-field="title"` and the body editor in `data-entry-field="body"`. A click on a thread scrolls the entry into view and focuses the first input, textarea or contenteditable inside the marker for the thread's field. When an entry's editors are unmounted, the click only scrolls.
5. Add selection commenting and highlights to the entry's Portable Text editor. When other editors share that component, put it behind a prop. `EntryBodyEditor.tsx` has the full wiring:
   - `useInlineCommentDraft` and `SelectionCommentButton` call `useEditor`, so they render inside the `EditorProvider` that holds `SDKValuePlugin`.
   - Show `SelectionCommentButton` while the editor has focus, `draft` is null and `commentableSelection` is set. Its click calls `startDraft`.
   - While `draft` is set, show `CommentComposer` with `onSubmit={submitDraft}` and `onClose={discardDraft}`.
   - Merge the result of `useSDKCommentDecorations` with `draftDecorations` into `rangeDecorations` on `PortableTextEditable`. The hook suspends while comments load, so wrap the editable in `LoadBoundary` with a plain editable as the fallback.
   - Style `.collection-entry-comment-draft` and whatever your `renderDecoration` returns. `collectionEntries.css` has the demo's version.

## Known gaps

- `createInlineComment` writes no `contentSnapshot`, so Studio's comments panel shows body comments made from the collection without the quoted text. Fix: the plugin would pass the selected blocks as `contentSnapshot`, which `createComment` already accepts. [SAPP-4623](https://linear.app/sanity/issue/SAPP-4623/plugin-sdk-value-createinlinecomment-doesnt-write-contentsnapshot-so)
- `createInlineComment` takes no `context`, so a mention in a body comment would notify nobody. Fix: the plugin would forward a `context` option to `createComment`. [SAPP-4624](https://linear.app/sanity/issue/SAPP-4624/plugin-sdk-value-createinlinecomment-has-no-context-option-so-mentions)
- Mentions cannot be written, because the composer is a plain textarea. Mentions in existing comments render. Fix: a mention picker that writes `mention` children with a `userId`, plus `context.notification` so they send email.
- Reactions are read-only in the SDK, and the column does not show them. Fix: an SDK action to add one. Until then, react on the entry page.
- The column shows no quoted text and no dates, to keep it minimal. Fix: read `createdAt`, and the quote from `parentComment.selection`, whose text marks the selection with U+F000 and U+F001.
- With Studio's comments off for collections, the collection's own fields take no comments. Fix: keep Studio's comments on for collections and accept a second comments panel on that page.
- Only open threads are listed. Resolve works from the column, and reopening happens on the entry page.
- Studio's selected release is not passed to the SDK, so comments made inside a release are not listed and comments written from the collection land outside the release. Fix: pass `perspective: {releaseName}` on every comments handle.
- Each entry opens its own comments listener, so a collection with N entries holds N listeners. An entry's column section and its body highlights share one. Fix: the SDK would need a multi-document comments read.
- `registerInlineEntry` keeps a module-level map keyed by entry id, so click-to-jump assumes one collection view per page. With two open, a click jumps to whichever entry registered last. Fix: key the map by collection id and entry id.
- A comment whose create request fails stays listed until the page reloads, carrying `state.type === 'createError'`, and the column renders it like a saved comment. Fix: mark failed rows, with Retry (`createComment` with the same `commentId`) and Discard (`removeComment`).

## Run the demo

The `collection-entries` workspace points at project `ppsg7ml5`, dataset `test`. To run it against another project, change `projectId` and `dataset` on its entry in `dev/test-studio/sanity.config.ts`.

```bash
pnpm install
pnpm build # sanity dev loads the built packages
pnpm dev
```

1. Open `http://localhost:3333/collection-entries` and sign in.
2. Click "Create sample collection". It creates a collection with three entries, with ids that start `collection-entries-`. Open it.
3. Select text in an entry body, click "Comment" and send. The text highlights and the thread shows in "Entry comments".
4. Click "Open entry" on the thread. The entry opens with Studio's comments panel on that thread. Add a comment there, then click "Back to collection".
5. The column lists the new comment. Click a thread to scroll the form to its entry and focus the commented field.
