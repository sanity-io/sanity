import {promptForDatasetName} from '../actions/init-project/promptForDatasetName'
import {promptForAclMode, promptForDefaultConfig} from '../actions/init-project/prompts/index'
import {createProject, type CreateProjectOptions} from '../actions/project/createProject'
import {type CliApiClient, type CliCommandContext, type CliPrompter} from '../types'
import {type ProjectOrganization} from './organizationUtils'

// Project name validation and prompting
export function validateProjectName(input: string): string | true {
  if (!input || input.trim() === '') {
    return 'Project name cannot be empty'
  }
  if (input.length > 80) {
    return 'Project name cannot be longer than 80 characters'
  }
  return true
}

export async function promptForProjectName(prompt: CliPrompter): Promise<string> {
  return prompt.single({
    type: 'input',
    message: 'Project name:',
    default: 'My Sanity Project',
    validate: validateProjectName,
  })
}

// Dataset prompting and creation - matches init command behavior exactly
export const DATASET_INFO_TEXT =
  'Your content will be stored in a dataset that can be public or private, depending on\n' +
  'whether you want to query your content with or without authentication.\n' +
  'The default dataset configuration has a public dataset named "production".'

export interface DatasetCreationOptions {
  context: CliCommandContext
  datasetName?: string // If provided, skip name prompting
  datasetVisibility?: 'public' | 'private' // If provided, skip visibility prompting
  unattended?: boolean // If true, use defaults without prompting
}

export interface DatasetResult {
  name: string
  visibility: 'public' | 'private'
}

export async function promptAndCreateDataset(
  options: DatasetCreationOptions,
): Promise<{name: string; visibility: 'public' | 'private'}> {
  const {context, datasetName, datasetVisibility, unattended} = options
  const {prompt, output} = context

  let finalDatasetName: string
  let finalVisibility: 'public' | 'private'
  let useDefaultConfig = false

  // Determine dataset name - exactly like init command
  if (datasetName) {
    // Explicit name provided
    finalDatasetName = datasetName
  } else if (unattended) {
    // Unattended mode - use default
    finalDatasetName = 'production'
    useDefaultConfig = true
  } else {
    // Interactive mode - show info and prompt (exactly like init)
    output.print(DATASET_INFO_TEXT)
    useDefaultConfig = await promptForDefaultConfig(prompt)

    if (useDefaultConfig) {
      finalDatasetName = 'production'
    } else {
      finalDatasetName = await promptForDatasetName(prompt, {
        message: 'Name of your first dataset:',
      })
    }
  }

  // Determine dataset visibility - exactly like init command
  if (datasetVisibility) {
    // Explicit visibility provided
    finalVisibility = datasetVisibility
  } else if (unattended || useDefaultConfig) {
    // Unattended mode or user chose default config - use default
    finalVisibility = 'public'
  } else {
    // Interactive mode and user didn't choose default - prompt for ACL
    finalVisibility = (await promptForAclMode(prompt, output)) as 'public' | 'private'
  }

  return {name: finalDatasetName, visibility: finalVisibility}
}

export async function createDatasetForProject(
  context: CliCommandContext,
  projectId: string,
  datasetName: string,
  visibility: 'public' | 'private',
): Promise<DatasetResult> {
  const {apiClient, output} = context

  const spinner = output.spinner('Creating dataset').start()
  try {
    // Use the same pattern as init command - create client with project context
    const client = apiClient({api: {projectId}})
    await client.datasets.create(datasetName, {aclMode: visibility})

    spinner.succeed()
    return {name: datasetName, visibility}
  } catch (err) {
    spinner.fail()
    throw err
  }
}

// Project creation with shared metadata and progress indicator
export async function createProjectWithMetadata(
  apiClient: CliApiClient,
  displayName: string,
  organizationId: string | undefined,
  context: CliCommandContext,
  extraMetadata: Record<string, any> = {},
): Promise<{projectId: string; displayName: string}> {
  const {output} = context
  const spinner = output.spinner('Creating project').start()

  try {
    const createOptions: CreateProjectOptions = {
      displayName,
      organizationId,
      metadata: {
        integration: 'cli',
        ...extraMetadata,
      },
    }

    const result = await createProject(apiClient, createOptions)
    spinner.succeed()
    return result
  } catch (error) {
    spinner.fail()
    throw error
  }
}

// Project output formatting
export interface ProjectCreationResult {
  projectId: string
  displayName: string
  organization?: ProjectOrganization
  dataset?: {
    name: string
    visibility: 'public' | 'private'
  }
}

export function formatProjectUrl(projectId: string, apiHost: string): string {
  const mainHostname = new URL(apiHost).hostname.split('.').slice(-2).join('.')
  return `https://www.${mainHostname}/manage/project/${projectId}`
}

export function printProjectCreationSuccess(
  result: ProjectCreationResult,
  format: 'text' | 'json' | string,
  context: CliCommandContext,
): void {
  const {output, apiClient} = context

  if (format === 'json') {
    output.print(JSON.stringify(result, null, 2))
    return
  }

  output.print(`Project created successfully!`)
  output.print(`ID: ${result.projectId}`)
  output.print(`Name: ${result.displayName}`)
  output.print(`Organization: ${result.organization?.name || 'Personal'}`)

  if (result.dataset) {
    output.print(`Dataset: ${result.dataset.name} (${result.dataset.visibility})`)
  }

  const {apiHost} = apiClient({
    requireProject: false,
    requireUser: false,
  }).config()

  output.print(``)
  output.print(`Manage your project: ${formatProjectUrl(result.projectId, apiHost)}`)
}
