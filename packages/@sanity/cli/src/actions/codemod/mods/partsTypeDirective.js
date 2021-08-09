const purpose = 'Add parts types directive to all ts/tsx files that has one or more part imports'
const description = `
Adds a '///<reference types="@sanity/types/parts" />' header to all source files that has one or more part imports.
For example:

Before:
---- somefile.ts
import client from 'part:@sanity/base/client'
//…
----

After:
---- somefile.ts
///<reference types="@sanity/types/parts" />
import client from 'part:@sanity/base/client'
//…
----


`.trim()

module.exports = {
  purpose,
  description,
  verify: async (context) => {},
}
