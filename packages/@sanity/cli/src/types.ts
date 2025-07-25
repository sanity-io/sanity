import {type SanityClient} from '@sanity/client'
import {type TelemetryLogger} from '@sanity/telemetry'
import type chalk from 'chalk'
import {type Answers, type ChoiceCollection, type DistinctQuestion, type Separator} from 'inquirer'
import {type Options, type Ora} from 'ora'
import {type ConfigEnv, type InlineConfig} from 'vite'

import {type CliPackageManager} from './packageManager'
import {type ClientRequirements} from './util/clientWrapper'
import {type CliConfigResult} from './util/getCliConfig'

export interface SanityCore {
  requiredCliVersionRange: string
  commands: (CliCommandDefinition | CliCommandGroupDefinition)[]
}

export interface SanityModuleInternal {
  cliProjectCommands: {
    requiredCliVersionRange: string
    commands: (CliCommandDefinition | CliCommandGroupDefinition)[]
  }
}

export interface PackageJson {
  name: string
  version: string
  scripts?: Record<string, string>

  description?: string
  author?: string
  license?: string
  private?: boolean

  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>

  repository?: {type: string; url: string}
}

export interface CliCommandGroupDefinition {
  name: string
  signature: string
  isGroupRoot: boolean
  description: string
  hideFromHelp?: boolean
}

export interface ResolvedCliCommand {
  command: CliCommandDefinition | CliCommandGroupDefinition
  commandName: string
  parentName?: string
  isGroup: boolean
  isCommand: boolean
}

export type CliCommandAction<F = Record<string, unknown>> = (
  args: CliCommandArguments<F>,
  context: CliCommandContext,
) => Promise<unknown>

export interface CliCommandDefinition<F = Record<string, unknown>> {
  name: string
  group?: string
  signature: string
  description: string
  helpText: string
  action: CliCommandAction<F>
  hideFromHelp?: boolean
}

export interface CliCommandArguments<F = Record<string, unknown>> {
  groupOrCommand: string
  argv: string[]
  extOptions: F
  argsWithoutOptions: string[]
  extraArguments: string[]
}

export type CliCommandContext = CliV2CommandContext | CliV3CommandContext

export interface CliBaseCommandContext {
  output: CliOutputter
  prompt: CliPrompter
  apiClient: CliApiClient
  sanityMajorVersion: 2 | 3
  cliConfigPath?: string
  cliRoot: string
  workDir: string
  corePath?: string
  chalk: typeof chalk
  commandRunner: CliCommandRunner
  fromInitCommand?: boolean
}

export interface TelemetryUserProperties {
  runtime: string
  runtimeVersion: string
  cliVersion: string
  machinePlatform: string
  cpuArchitecture: string
  projectId?: string
  dataset?: string
}

export interface CliV2CommandContext extends CliBaseCommandContext {
  sanityMajorVersion: 2
  cliConfig?: SanityJson
  cliPackageManager?: CliPackageManager
  telemetry: TelemetryLogger<TelemetryUserProperties>
}

export interface CliV3CommandContext extends CliBaseCommandContext {
  sanityMajorVersion: 3
  cliConfig?: CliConfig
  cliPackageManager: CliPackageManager
  telemetry: TelemetryLogger<TelemetryUserProperties>
}

export interface CliCommandRunner {
  commands: Readonly<(CliCommandDefinition | CliCommandGroupDefinition)[]>
  commandGroups: Readonly<Record<string, (CliCommandDefinition | CliCommandGroupDefinition)[]>>

  runCommand(
    commandOrGroup: string,
    args: CliCommandArguments,
    options: CommandRunnerOptions,
  ): Promise<unknown>

  resolveSubcommand(
    group: (CliCommandDefinition | CliCommandGroupDefinition)[],
    subCommandName: string,
    parentGroupName: string,
  ): ResolvedCliCommand | null
}

export interface CliUserConfig {
  cliLastUpdateCheck?: number
  cliLastUpdateNag?: number
  authToken?: string
  authType?: string
}

export interface CommandRunnerOptions {
  cliConfig: CliConfigResult | null
  cliRoot: string
  workDir: string
  corePath: string | undefined
  telemetry: TelemetryLogger<TelemetryUserProperties>
}

export interface CliOutputter {
  print: (...args: unknown[]) => void
  success: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  clear: () => void
  spinner(options: Options | string): Ora
}

export type SinglePrompt =
  | (Omit<DistinctQuestion, 'name'> & {type: 'list'; choices: ChoiceCollection})
  | (Omit<DistinctQuestion, 'name'> & {type: 'confirm'})
  | (Omit<DistinctQuestion, 'name'> & {type: 'input'})

export type CliPrompter = (<T extends Answers = Answers>(
  questions: DistinctQuestion<T>[],
) => Promise<T>) & {
  Separator: typeof Separator
  single: <T = string>(question: SinglePrompt) => Promise<T>
}

export type CliApiClient = (options?: ClientRequirements) => SanityClient

export interface CliYarnOptions {
  print?: CliOutputter['print']
  error?: CliOutputter['error']
  rootDir?: string
}

export type CliStubbedYarn = (args: string[], options?: CliYarnOptions) => Promise<void>

export interface CliApiConfig {
  projectId?: string
  dataset?: string
}

export interface SanityJson {
  root?: boolean

  project?: {
    name?: string
    basePath?: string
  }

  api?: CliApiConfig

  __experimental_spaces?: {
    name: string
    title: string
    default?: true
    api: {
      projectId?: string
      dataset?: string
    }
  }[]

  plugins?: string[]

  parts?: {
    name?: string
    path?: string
    implements?: string
    description?: string
  }[]

  env?: {
    production?: SanityJson
    staging?: SanityJson
    development?: SanityJson
  }
}

export interface GraphQLAPIConfig {
  /**
   * ID of GraphQL API. Only (currently) required when using the `--api` flag
   * for `sanity graphql deploy`, in order to only deploy a specific API.
   */
  id?: string

  /**
   * Name of workspace containing the schema to deploy
   *
   * Optional, defaults to `default` (eg the one used if no `name` is defined)
   */
  workspace?: string

  /**
   * Name of source containing the schema to deploy, within the configured workspace
   *
   * Optional, defaults to `default` (eg the one used if no `name` is defined)
   */
  source?: string

  /**
   * API tag for this API - allows deploying multiple different APIs to a single dataset
   *
   * Optional, defaults to `default`
   */
  tag?: string

  /**
   * Whether or not to deploy a "GraphQL Playground" to the API url - an HTML interface that allows
   * running queries and introspecting the schema from the browser. Note that this interface is not
   * secured in any way, but as the schema definition and API route is generally open, this does not
   * expose any more information than is otherwise available - it only makes it more discoverable.
   *
   * Optional, defaults to `true`
   */
  playground?: boolean

  /**
   * Generation of API to auto-generate from schema. New APIs should use the latest (`gen3`).
   *
   * Optional, defaults to `gen3`
   */
  generation?: 'gen3' | 'gen2' | 'gen1'

  /**
   * Define document interface fields (`_id`, `_type` etc) as non-nullable.
   * If you never use a document type as an object (within other documents) in your schema types,
   * you can (and probably should) set this to `true`. Because a document type _could_ be used
   * inside other documents, it is by default set to `false`, as in these cases these fields
   * _can_ be null.
   *
   * Optional, defaults to `false`
   */
  nonNullDocumentFields?: boolean

  /**
   * Suffix to use for generated filter types.
   *
   * Optional, Defaults to `Filter`.
   *
   */
  filterSuffix?: string
}

/**
 * Until these types are on npm: https://github.com/facebook/react/blob/0bc30748730063e561d87a24a4617526fdd38349/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts#L39-L122
 * @beta
 */
export interface ReactCompilerConfig {
  /**
   * @see https://react.dev/learn/react-compiler#existing-projects
   */
  sources?: Array<string> | ((filename: string) => boolean) | null

  /**
   * The minimum major version of React that the compiler should emit code for. If the target is 19
   * or higher, the compiler emits direct imports of React runtime APIs needed by the compiler. On
   * versions prior to 19, an extra runtime package react-compiler-runtime is necessary to provide
   * a userspace approximation of runtime APIs.
   * @see https://react.dev/learn/react-compiler#using-react-compiler-with-react-17-or-18
   */
  target: '18' | '19'

  panicThreshold?: 'ALL_ERRORS' | 'CRITICAL_ERRORS' | 'NONE'

  compilationMode?: 'infer' | 'syntax' | 'annotation' | 'all'
}

interface AppConfig {
  organizationId: string
  /**
   * Defaults to './src/App'
   */
  entry?: string
  id?: string
}

export interface CliConfig {
  api?: CliApiConfig

  project?: {
    basePath?: string
  }

  /**
   * Wraps the Studio in `<React.StrictMode>` root to aid flagging potential problems related to concurrent features (`startTransition`, `useTransition`, `useDeferredValue`, `Suspense`)
   * Can also be enabled by setting `SANITY_STUDIO_REACT_STRICT_MODE="true"|"false"`.
   * It only applies to `sanity dev` in dev mode, it's ignored in `sanity build` and in production.
   * Defaults to `false`
   */
  reactStrictMode?: boolean

  /**
   * The React Compiler is currently in beta, and is disabled by default.
   * @see https://react.dev/learn/react-compiler
   * @beta
   */
  reactCompiler?: ReactCompilerConfig

  server?: {
    hostname?: string
    port?: number
  }

  graphql?: GraphQLAPIConfig[]

  vite?: UserViteConfig

  autoUpdates?: boolean

  studioHost?: string

  /**
   * Parameter used to configure other kinds of applications.
   * Signals to `sanity` commands that this is not a studio.
   */
  app?: AppConfig

  /**
   * Configuration for Sanity media libraries.
   */
  mediaLibrary?: {
    /**
     * The path to the Media Library aspects directory. When using the CLI to manage aspects, this
     * is the directory they will be read from and written to.
     */
    aspectsPath: string
  }
}

export type UserViteConfig =
  | InlineConfig
  | ((config: InlineConfig, env: ConfigEnv) => InlineConfig | Promise<InlineConfig>)

export type SanityUser = {
  id: string
  name: string
  email: string
  profileImage?: string
  tosAcceptedAt?: string
  provider: 'google' | 'github' | 'sanity' | `saml-${string}`
}
