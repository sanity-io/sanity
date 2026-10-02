# @sanity/validation

Validates complete Sanity documents against a compiled Sanity schema.

```ts
import {validateDocument, validationMarkerCodes} from '@sanity/validation'

const result = await validateDocument({document, schema, client})

for (const marker of result.markers) {
  if (marker.code === validationMarkerCodes.stringMinimumLength) {
    const {actualLength, minimumLength} = marker.details || {}
    if (typeof actualLength === 'number' && typeof minimumLength === 'number') {
      console.log(`Expected at least ${minimumLength} characters, got ${actualLength}`)
    }
  }
}

const summary = result.markers
  .map((marker) => {
    const path = marker.path
      .map((segment) => (typeof segment === 'object' ? segment._key : segment))
      .join('.')

    return `[${marker.level}] ${path || '<document>'}: ${marker.message} (${marker.code})`
  })
  .join('\n')
```

Every failed marker includes a stable machine-readable `code` alongside its localized `message`,
`level`, and `path`. Built-in failures may also include structured `details`. Custom validators can
return their own `code` and `details`; custom codes should be namespaced, for example
`custom.seo-title`.

When a check cannot run, `result.status` is `notEvaluated`. Omitting `client` disables custom
callbacks and skips network checks. Pass `customValidation: false` to disable custom callbacks while
still providing a client.

`validationMode: 'structural'` checks types, unknown fields, and reference shapes, skipping content rules,
custom callbacks, and network requests. Defaults to `full`; `status` covers only the selected checks.

Pass one `AbortSignal` to cancel validation and its pending network work. Built-in checks and client
requests made through a custom validator's `context.getClient()` inherit this signal. A custom
`getDocumentExists` callback receives it as an argument; custom work using another API should pass
`context.signal` to that API. Cancellation rejects with the signal's reason (an `AbortError` when
no custom reason was supplied). Work that does not accept an abort signal cannot be stopped, even
though validation itself rejects immediately.

```ts
const controller = new AbortController()
const validation = validateDocument({document, schema, client, signal: controller.signal})
const reason = new Error('Validation cancelled')

controller.abort(reason)
try {
  await validation
} catch (error) {
  if (error !== reason) throw error
}
```

The package does not apply mutations or decide whether a document may be edited or published.

## Validating multiple documents

Use `validateDocuments` to validate documents in parallel with shared reference-check batching and
one fetch concurrency limit for the entire batch. `maxFetchConcurrency` defaults to 25.

```ts
import {validateDocuments} from '@sanity/validation'

const results = await validateDocuments({
  documents,
  schema,
  client,
  maxFetchConcurrency: 10,
})

for (const [index, result] of results.entries()) {
  console.log(documents[index]._id, result.status, result.markers)
}
```

Passing a `signal` cancels the entire batch and its pending network work.

## Migrating from `sanity`

Add `@sanity/validation` as a direct dependency. The workspace-based API is available as a
deprecated compatibility helper, so call sites that only import the validation function can
migrate by changing the imported symbol:

```ts
import {validateDocumentWithWorkspace} from '@sanity/validation'

const markers = await validateDocumentWithWorkspace({document, workspace})
```

Call sites that also import `ValidateDocumentOptions` from `sanity` should use
`ValidateDocumentWorkspaceOptions` for the workspace-shaped options.

Prefer `validateDocument({document, schema, client})` for new code.
