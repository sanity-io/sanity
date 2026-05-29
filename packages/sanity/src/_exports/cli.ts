export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {createCliConfig, defineCliConfig, getCliClient} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'

// Workbench application extension API. Canonical implementation lives in
// `@sanity/federation`; surfaced here so app authors declare their app with
// `import {unstable_defineApp} from 'sanity/cli'`.
export {unstable_defineApp, type DefineAppInput} from '@sanity/federation'
