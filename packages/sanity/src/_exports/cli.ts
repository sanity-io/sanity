export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {createCliConfig, defineCliConfig, getCliClient} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'

// Workbench application extension API. Re-exported from `@sanity/cli` (which
// sources it from `@sanity/federation`) so app authors declare their app with
// `import {unstable_defineApp} from 'sanity/cli'`.
export {type DefineAppInput, unstable_defineApp} from '@sanity/cli'
