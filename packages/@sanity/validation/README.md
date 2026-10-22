# @sanity/validation

Validate Sanity documents against a compiled schema.

```ts
import {validateDocument} from '@sanity/validation'

const {complete, markers} = await validateDocument({document, schema, client})

if (!complete) {
  console.log('Validation is inconclusive', markers)
} else {
  console.log(
    'Fully evaluated',
    markers.filter(({level}) => level === 'error'),
  )
}
```

- `markers`: document findings with a stable `code`, localized `message`, `level`, `path`, and optional `details`.
- `complete`: whether every applicable check could be evaluated. When `false`, treat validation as inconclusive even if markers exist.
- Markers retain Studio behavior. When incomplete, top-level codes alone cannot classify findings: composite rules can wrap execution failures in `details.causes`.
- Custom validators should return messages for findings and throw when they cannot evaluate.
- `status` is deprecated; use `complete` and inspect marker levels and codes. It treats any marker as `failed`.
- Built-in codes: `validationMarkerCodes`. Custom validators can return namespaced codes such as `custom.seo-title`.
- Omit `client` for local checks without custom callbacks or network checks. Skipped checks make `complete` false. Use `customValidation: false` to skip custom callbacks while keeping network checks.
- Precompiled rules retain their original package version's behavior; recompile with the current version for current callback-skipping and concurrency semantics.

## Batch validation

```ts
import {validateDocuments} from '@sanity/validation'

const results = await validateDocuments({documents, schema, client, maxFetchConcurrency: 10})
// Results follow input order; reference batching and fetch concurrency are shared.
```

`maxFetchConcurrency` defaults to 25. One `signal` cancels the entire batch.

## Cancellation

```ts
const controller = new AbortController()
const pending = validateDocument({document, schema, client, signal: controller.signal})
controller.abort() // `pending` rejects with the abort reason.
```

Custom validators receive `context.signal`; pass it to external work. Requests through
`context.getClient()` inherit it automatically. `getDocumentExists` also receives the signal;
work that does not support cancellation may keep running after validation rejects.

## Migrating from `sanity`

Add `@sanity/validation` as a direct dependency. For existing workspace-based calls:

```ts
import {validateDocumentWithWorkspace} from '@sanity/validation'

const markers = await validateDocumentWithWorkspace({document, workspace})
```

This deprecated helper returns only markers and cannot report completeness. Its options type is
`ValidateDocumentWorkspaceOptions`. Prefer `validateDocument({document, schema, client})` for new code.

## Benchmarks

After building, run `pnpm --filter @sanity/validation bench`. Results: `.vitest/benchmarks/`.
