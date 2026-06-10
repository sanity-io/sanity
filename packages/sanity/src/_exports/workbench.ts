/**
 * Note: we are forwarding the workbench render function from the workbench paackage,
 * to avoid having to install the workbench package as a dependency in the user project.
 */

export {renderWorkbench} from '@sanity/workbench/_internal'

// Browser-safe workbench runtime authoring helpers. Panel and service `src`
// modules bundle to the browser (and run through `sanity dev`, which doesn't
// tree-shake), so these are sourced from `@sanity/federation` — a pure package —
// never the Node `@sanity/cli`. Importing them from `sanity/cli` would drag the
// CLI into the frontend bundle and break the module at load. The types are
// inlined via `bundledPackages` (see package.config.ts), so consumers don't need
// `@sanity/federation` installed. Config-time `unstable_defineApp` lives on
// `sanity/cli`.
export {unstable_defineService, unstable_defineView} from '@sanity/federation'
