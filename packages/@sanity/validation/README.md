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

Pass an `AbortSignal` to cancel validation and its pending network work. Cancellation rejects with
the signal's reason (an `AbortError` when no custom reason was supplied).

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
