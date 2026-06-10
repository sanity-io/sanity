export type {CliClientOptions, CliConfig} from '@sanity/cli'
export {createCliConfig, defineCliConfig, getCliClient} from '@sanity/cli'
export {getStudioEnvironmentVariables, type StudioEnvVariablesOptions} from '@sanity/cli/_internal'

// Workbench application extension API — config-time `unstable_defineApp` and the
// browser-safe runtime helpers (`unstable_defineService`/`unstable_defineView`).
// Sourced directly from `@sanity/federation` (the pure package that defines them,
// which `@sanity/cli` also re-exports) and inlined into this entry's types via
// `bundledPackages`, so `sanity/cli` consumers get full typing — and the runtime
// value — without installing `@sanity/cli`. Going through `@sanity/cli`'s subpaths
// instead leaves machine-specific absolute import paths in the generated `.d.ts`.
export {
  type DefineAppInput,
  unstable_defineApp,
  unstable_defineService,
  unstable_defineView,
} from '@sanity/federation'
