# Reproduction — sanity-io/sanity#12927

> `getWorkspace` is not exported by `@sanity/cli-core@1.3.2`, but three worker
> threads in `@sanity/cli@6.7.0` and `@sanity/cli-build@0.2.0` import it from
> there. The result: `sanity schema extract`, `sanity schema validate`, and
> `sanity documents validate` all crash with `getWorkspace is not a function`.

## TL;DR for the maintainer

The fix lives in `@sanity/cli-core`: add `export * from '../util/getWorkspace.js'`
(or wherever the helper now lives) to `packages/@sanity/cli-core/src/_exports/index.ts`,
publish a patch, then make sure `@sanity/cli` and `@sanity/cli-build` depend on
the fixed version. Pinning to `@sanity/cli@6.6.0` is the user-facing workaround
until the patch is out.

## Run the repro

```bash
cd repros/issue-12927
npm install
npm run repro:validate-schema   # cleanest hit — crashes inside the worker, no auth required
npm run repro:extract           # same crash via cli-build@0.2.0
npm run repro:validate-docs     # same crash via cli@6.7.0 (after auth prompt; needs `sanity login` first)
```

## What you'll see

```
$ npm run repro:validate-schema
- Validating schema…
 ›   Error: Error validating schema: Worker error: (0 , __vite_ssr_import_1__.getWorkspace) is not a function

$ npm run repro:extract
- Extracting schema
✖ Failed to extract schema
 ›   Error: (0 , __vite_ssr_import_1__.getWorkspace) is not a function
```

Both errors were captured live against published `@sanity/cli@6.7.0` + `sanity@5.28.0`
in a clean Ubuntu 24.04 / Node 20.20 sandbox.

## The smoking gun (no install required)

`getWorkspace` is imported by three published workers but isn't exported by the
`@sanity/cli-core` version they all resolve to:

```bash
npm pack @sanity/cli@6.7.0 @sanity/cli-build@0.2.0 @sanity/cli-core@1.3.2
mkdir -p cli cli-build cli-core
tar -xzf sanity-cli-6.7.0.tgz       -C cli
tar -xzf sanity-cli-build-0.2.0.tgz -C cli-build
tar -xzf sanity-cli-core-1.3.2.tgz  -C cli-core

# What the workers import(broken):
grep -n 'getWorkspace' cli/package/dist/actions/schema/validateSchema.worker.js
# 2: import { findStudioConfigPath, getStudioWorkspaces, getWorkspace } from '@sanity/cli-core';

grep -n 'getWorkspace' cli/package/dist/actions/documents/validateDocuments.worker.js
# 7: import { getStudioWorkspaces, getWorkspace, resolveLocalPackage } from '@sanity/cli-core';

grep -n 'getWorkspace' cli-build/package/dist/actions/schema/extractSanitySchema.worker.js
# 2: import { getStudioWorkspaces, getWorkspace } from '@sanity/cli-core';

# What cli-core actually exports (the bug):
grep -rn 'getWorkspace' cli-core/package/dist/
# (no output — the symbol isn't re-exported anywhere)

grep -n 'getStudioWorkspaces' cli-core/package/dist/_exports/index.js
# 6: export * from '../config/studio/getStudioWorkspaces.js';
# … but no corresponding line for getWorkspace
```

## Where the regression came from

`@sanity/cli@6.6.0` shipped its own copy of the helper and imported it locally:

```bash
npm pack @sanity/cli@6.6.0
mkdir cli-66 && tar -xzf sanity-cli-6.6.0.tgz -C cli-66
head -5 cli-66/package/dist/actions/schema/validateSchema.worker.js
# import { isMainThread, parentPort, workerData } from 'node:worker_threads';
# import { findStudioConfigPath, getStudioWorkspaces } from '@sanity/cli-core';
# import { DescriptorConverter } from '@sanity/schema/_internal';
# import { getWorkspace } from '../../util/getWorkspace.js';     <-- LOCAL IMPORT
# import { isSchemaError } from '../../util/isSchemaError.js';
```

Between 6.6.0 and 6.7.0 the worker imports were rewritten to point at
`@sanity/cli-core`, but `getWorkspace` was never added to cli-core's
`_exports/index.ts`.

## Affected commands

| Command                       | Worker file                                                | Package                      |
| ----------------------------- | ---------------------------------------------------------- | ---------------------------- |
| `sanity schema extract`       | `dist/actions/schema/extractSanitySchema.worker.js`        | `@sanity/cli-build@0.2.0`    |
| `sanity schema validate`      | `dist/actions/schema/validateSchema.worker.js`             | `@sanity/cli@6.7.0`          |
| `sanity documents validate`   | `dist/actions/documents/validateDocuments.worker.js`       | `@sanity/cli@6.7.0`          |

## User-facing workaround

Pin `@sanity/cli@6.6.0` until the cli-core patch is out.
