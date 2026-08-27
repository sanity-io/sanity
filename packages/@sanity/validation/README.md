# @sanity/validation

Validates complete Sanity documents against a compiled Sanity schema.

```ts
import {validateDocument} from '@sanity/validation'

const markers = await validateDocument({document, schema, client})
```

The package reports validation markers. It does not apply mutations or decide whether a document
may be edited or published.

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
