# @sanity/validation

Validates complete Sanity documents against a compiled Sanity schema.

```ts
import {validateDocument} from '@sanity/validation'

const markers = await validateDocument({document, schema, client})
```

The package reports validation markers. It does not apply mutations or decide whether a document
may be edited or published.
