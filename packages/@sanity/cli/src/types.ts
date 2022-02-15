import type ora from 'ora'
import type chalk from 'chalk'
import type {Ora} from 'ora'
import type {ExecaReturnValue} from 'execa'
import type {SanityClient} from '@sanity/client'
import type {Separator, DistinctQuestion, Answers, ChoiceCollection} from 'inquirer'
import type {ClientRequirements} from './util/clientWrapper'

export interface SanityCore {
  requiredCliVersionRange: string
  commands: CliCommandDefinition[]
}

export interface PackageJson {
  name: string
  version: string

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
  context: CliCommandContext
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
  yarn: CliBundledYarn
  sanityMajorVersion: 2 | 3
  cliConfigPath?: string
  cliRoot: string
  workDir: string
  corePath?: string
  chalk: typeof chalk
  commandRunner: CliCommandRunner
}
export interface CliV2CommandContext extends CliBaseCommandContext {
  sanityMajorVersion: 2
  cliConfig?: SanityJson
}

export interface CliV3CommandContext extends CliBaseCommandContext {
  sanityMajorVersion: 3
  cliConfig?: CliConfig
}

export interface CliCommandRunner {
  commands: Readonly<(CliCommandDefinition | CliCommandGroupDefinition)[]>
  commandGroups: Readonly<Record<string, (CliCommandDefinition | CliCommandGroupDefinition)[]>>

  runCommand(
    commandOrGroup: string,
    args: CliCommandArguments,
    options: CommandRunnerOptions
  ): Promise<unknown>

  resolveSubcommand(
    group: (CliCommandDefinition | CliCommandGroupDefinition)[],
    subCommandName: string,
    parentGroupName: string
  ): ResolvedCliCommand | null
}

export interface CliUserConfig {
  cliLastUpdateCheck?: number
  cliLastUpdateNag?: number
  authToken?: string
  authType?: string
}

export interface CommandRunnerOptions {
  cliRoot: string
  workDir: string
  corePath: string | undefined
}

export interface CliOutputter {
  print: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  clear: () => void
  spinner(options: ora.Options | string): Ora
}

export type SinglePrompt =
  | (Omit<DistinctQuestion, 'name'> & {type: 'list'; choices: ChoiceCollection})
  | (Omit<DistinctQuestion, 'name'> & {type: 'confirm'})
  | (Omit<DistinctQuestion, 'name'> & {type: 'input'})

export type CliPrompter = (<T extends Answers = Answers>(
  questions: DistinctQuestion<T>[]
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

export type CliBundledYarn = (
  args: string[],
  options?: CliYarnOptions
) => Promise<ExecaReturnValue<string>>

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

  // eslint-disable-next-line camelcase
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

export interface CliConfig {
  api?: CliApiConfig

  project?: {
    basePath?: string
  }

  server?: {
    hostname?: string
    port?: number
  }

  // @todo
  vite?: (config: any) => any
}
