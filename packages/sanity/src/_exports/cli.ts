export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {createCliConfig, defineCliConfig, getCliClient} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'

// Workbench application extension API — config-time only. `unstable_defineApp`
// declares an app in `sanity.cli.ts` (a Node context). Sourced from
// `@sanity/federation` and inlined into this entry's types via `bundledPackages`
// (see package.config.ts), so consumers get full typing without installing
// `@sanity/cli`/`@sanity/federation`, and without the machine-specific absolute
// import paths that `@sanity/cli`'s subpaths would leave in the generated `.d.ts`.
//
// The runtime authoring helpers (`unstable_defineService`/`unstable_defineView`)
// are NOT here — they bundle to the browser and live in `sanity/runtime`. This
// entry pulls in the Node `@sanity/cli`, so importing them from here would break
// panel/service modules at load (`sanity dev` doesn't tree-shake).
export {type DefineAppInput, unstable_defineApp} from '@sanity/federation'
