# Stega and Studio Fields

This document explains how stega-encoded metadata can leak into document content, what the Studio does to prevent it, and how to detect and clean up existing content that already contains it.

## What is stega?

[Stega](https://github.com/vercel/stega) (steganography) is the technique used by `@sanity/client/stega` to power [Visual Editing](https://www.sanity.io/docs/visual-editing): metadata about where a piece of content came from (a Content Source Map location) is encoded as a sequence of invisible unicode characters (zero-width spaces, joiners, and similar) and appended to the string values a front end renders. Overlays decode these invisible characters to link rendered content back to the right field in the Studio.

Because the characters are invisible, they travel along whenever someone copies text from a stega-enabled preview. If that text is pasted into a Studio field and saved, the invisible characters become part of the stored document value. Symptoms include:

- Strings that look identical but fail equality checks or full-text search
- Bloated document size (a single stega sequence is commonly 100+ characters)
- Broken slugs, URLs, and email addresses
- GROQ filters and joins that mysteriously don't match

## What the Studio does automatically

Pasting into Studio fields strips stega sequences from the pasted text:

- **Portable Text fields** clean pasted content as part of HTML/plain-text deserialization (via `@portabletext/html`, which runs `vercelStegaClean` on everything it parses).
- **Plain text fields** (`string`, `text`, `email`, `url`, `slug`, `tags`, `number`, arrays of primitives, and any custom input that spreads `elementProps` onto a native input or textarea) strip stega through the shared paste handler in `packages/sanity/src/core/form/utils/stegaPaste.ts`, wired up centrally in `PrimitiveField` and `ArrayOfPrimitivesItem`.

Only paste is intercepted, and only when a stega sequence is actually detected — otherwise native paste behavior (undo history, caret placement, etc.) is untouched.

This prevents _new_ contamination, but documents written before this behavior existed (or written by other clients) may still contain stega sequences. The sections below show how to surface and clean those.

## Banning stega from an input with validation

`stegaClean` from `@sanity/client/stega` removes stega sequences from a value; if cleaning a value changes it, it contained stega. A custom validation rule can use this to flag contaminated fields:

```ts
import {stegaClean} from '@sanity/client/stega'
import {defineField} from 'sanity'

defineField({
  name: 'title',
  type: 'string',
  validation: (rule) =>
    rule.custom((value) => {
      if (typeof value === 'string' && stegaClean(value) !== value) {
        return 'Value contains invisible characters, most likely from text copied out of a preview with visual editing enabled. Re-paste the text to fix.'
      }
      return true
    }),
})
```

For schema-wide coverage, extract the validator and reuse it:

```ts
import {stegaClean} from '@sanity/client/stega'
import {type CustomValidator} from '@sanity/types'

export const bansStega: CustomValidator<string | undefined> = (value) => {
  if (typeof value === 'string' && stegaClean(value) !== value) {
    return 'Value contains invisible characters, most likely from text copied out of a preview with visual editing enabled. Re-paste the text to fix.'
  }
  return true
}

// usage
defineField({
  name: 'title',
  type: 'string',
  validation: (rule) => rule.custom(bansStega),
})
```

Since the Studio now strips stega on paste, editors can resolve the error simply by re-pasting the same text (or retyping it).

## Auto-fixing existing content with a migration

Use the [migration tooling](https://www.sanity.io/docs/schema-and-content-migrations) to clean documents already in the dataset. The `string` node visitor is called for every string value in every document, which makes stripping stega everywhere a one-liner:

```ts
// migrations/strip-stega/index.ts
import {stegaClean} from '@sanity/client/stega'
import {at, defineMigration, set} from 'sanity/migrate'

export default defineMigration({
  title: 'Strip stega metadata from all string values',
  // Optionally limit the migration, e.g.:
  // documentTypes: ['post', 'page'],

  migrate: {
    string(node, path) {
      const cleaned = stegaClean(node)
      if (cleaned !== node) {
        return at(path, set(cleaned))
      }
      return undefined
    },
  },
})
```

Run it with a dry run first (dry run is the default), then apply:

```sh
npx sanity migration run strip-stega
npx sanity migration run strip-stega --no-dry-run
```

Notes:

- `stegaClean` only removes sequences of four or more consecutive characters from the stega alphabet, so legitimate uses of individual zero-width joiners (e.g. emoji sequences like 👨‍👩‍👧) are unaffected.
- The migration only emits patches for values that actually change, so it is safe to run repeatedly.

## Fixing a single document from the UI

For one-off fixes, editors can re-paste the offending text — the Studio's paste handling now strips the stega sequence. Combined with the validation rule above, this gives editors both a signal (the validation error) and a fix (re-paste) without leaving the form.
