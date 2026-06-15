# Variant Definition Actions

Variant definition writes should use the actions API instead of direct document mutations. The actions target the persisted `system.variant` definition documents under `_.variants.*`.

## Variant Definition Document

The actions operate on variant definition documents with this persisted shape:

```ts
interface VariantDefinitionDocument {
  _id: `_.variants.${string}`
  _type: 'system.variant'
  name: string
  conditions: Record<string, string>
  priority: number
  metadata?: Record<string, unknown>
}
```

`variantId` is the generated short ID suffix, not the full document ID. For example, a `variantId` such as `Ab12cd34` maps to the stored document ID `_.variants.Ab12cd34`.

## `sanity.action.variant.definition.create`

Creates a new variant definition document.

Required fields:

- `actionType: 'sanity.action.variant.definition.create'`
- `variantId`: the short variant name used to create `_.variants.{variantId}`

Optional fields:

- `conditions`: exact-match condition map. Empty conditions are accepted, but such a definition is inert for matching.
- `priority`: numeric priority. Defaults to `0` when omitted.
- `metadata`: free-form metadata for Studio UI concerns such as `title` and `description`.

Example:

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.create',
  variantId: 'Ab12cd34',
  conditions: {audience: 'loyal'},
  priority: 0,
  metadata: {title: 'Loyal customers'},
})
```

Behavior:

- Creates `_.variants.{variantId}` with `_type: 'system.variant'` and `name: variantId`.
- Fails when a variant definition with the same ID already exists.
- Validates the variant ID as a single path segment.
- Validates condition keys and values.
- Applies variant definition feature and count-limit checks on the API side.

Condition validation:

- Keys must be lowercase, start with a letter, and match `[a-z][a-z0-9_-]{0,63}`.
- Keys with reserved prefixes `_` or `$` are rejected.
- Values must be non-empty valid UTF-8 strings.

## `sanity.action.variant.definition.edit`

Edits an existing variant definition document.

Required fields:

- `actionType: 'sanity.action.variant.definition.edit'`
- `variantId`: the short variant name for `_.variants.{variantId}`
- `patch`: a patch without an `_id`; the action applies it to the matching variant definition document

Optional fields:

- `ifRevisionId`: optimistic concurrency guard. The action fails if the current document revision does not match.

Example:

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.edit',
  variantId: 'Ab12cd34',
  patch: {
    set: {
      'conditions': {audience: 'loyal', locale: 'en-US'},
      'priority': 10,
      'metadata.title': 'Loyal customers in the US',
    },
  },
})
```

Behavior:

- Fails if the variant definition does not exist.
- Fails when `ifRevisionId` is provided and does not match the current document revision.
- Allows patches only under mutable paths:
  - `conditions` or `conditions.*`
  - `priority`
  - `metadata` or `metadata.*`
- Rejects patches to immutable fields such as `_id`, `_type`, `name`, and system timestamps.
- Validates the resulting variant definition document after applying the patch.

Useful patch patterns:

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.edit',
  variantId: 'Ab12cd34',
  patch: {
    set: {conditions: {audience: 'loyal'}},
  },
})

await client.action({
  actionType: 'sanity.action.variant.definition.edit',
  variantId: 'Ab12cd34',
  patch: {
    unset: ['metadata'],
  },
})
```

## `sanity.action.variant.definition.delete`

Deletes an existing variant definition document.

Required fields:

- `actionType: 'sanity.action.variant.definition.delete'`
- `variantId`: the short variant name for `_.variants.{variantId}`

Optional fields:

- `ifRevisionId`: optimistic concurrency guard. The action fails if the current document revision does not match.

Example:

```ts
await client.action({
  actionType: 'sanity.action.variant.definition.delete',
  variantId: 'Ab12cd34',
})
```

Behavior:

- Fails if the variant definition does not exist.
- Fails when `ifRevisionId` is provided and does not match the current document revision.
- Submits a delete for `_.variants.{variantId}`.
- Does not cascade delete variant documents.
- Strong references to the variant definition block deletion through the mutation engine, and the action surfaces that integrity error.
