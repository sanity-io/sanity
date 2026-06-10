export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {createCliConfig, defineCliConfig, getCliClient} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'

// Workbench application extension API. Re-exported from `@sanity/cli` (which
// sources it from `@sanity/federation`) so app authors declare their app with
// `import {unstable_defineApp} from 'sanity/cli'`.
export {type DefineAppInput, unstable_defineApp} from '@sanity/cli'

// Browser-safe runtime authoring helpers — panel/service `src` files bundle to
// the browser. Sourced from `@sanity/cli/runtime`, which re-exports only from
// `@sanity/federation` (never anything Node-only), so importing these from
// `sanity/cli` doesn't pull the CLI into the frontend bundle.
export {unstable_defineService, unstable_defineView} from '@sanity/cli/runtime'
