# @sanity/validation

Validates complete Sanity documents against a compiled Sanity schema.

```ts
import {validateDocument, validationMarkerCodes} from '@sanity/validation'

const markers = await validateDocument({document, schema, client})

for (const marker of markers) {
  if (marker.code === validationMarkerCodes.stringMinimumLength) {
    const {actualLength, minimumLength} = marker.details || {}
    if (typeof actualLength === 'number' && typeof minimumLength === 'number') {
      console.log(`Expected at least ${minimumLength} characters, got ${actualLength}`)
    }
  }
}

const summary = markers
  .map((marker) => {
    const path = marker.path
      .map((segment) => (typeof segment === 'object' ? segment._key : segment))
      .join('.')

    return `[${marker.level}] ${path || '<document>'}: ${marker.message} (${marker.code})`
  })
  .join('\n')
```

Every returned marker includes a stable machine-readable `code` alongside its localized `message`,
`level`, and `path`. Built-in failures may also include structured `details`. Custom validators can
return their own `code` and `details`; custom codes should be namespaced, for example
`custom.seo-title`.

The package does not apply mutations or decide whether a document may be edited or published.

## Migrating from `sanity`

Add `@sanity/validation` as a direct dependency. The workspace-based API is available as a
compatibility overload, so call sites that only import `validateDocument` can migrate by changing
the import:

```ts
import {validateDocument} from '@sanity/validation'

const markers = await validateDocument({document, workspace})
```

Call sites that also import `ValidateDocumentOptions` from `sanity` should use
`ValidateDocumentWorkspaceOptions` for the workspace-shaped options.

Prefer the `{document, schema, client}` API for new code.
