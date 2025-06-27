import {type CliCommandContext} from '../../types'
import {isInteractive} from '../../util/isInteractive'
import {getOrganizationId, type ProjectOrganization} from '../../util/organizationUtils'
import {createProject, type CreateProjectOptions} from './createProject'

export interface CreateProjectActionOptions {
  projectName?: string
  organizationId?: string
  createDataset?: boolean
  datasetName?: string
  datasetVisibility?: 'public' | 'private'
  unattended?: boolean
}

export interface CreateProjectActionResult {
  projectId: string
  displayName: string
  organization?: {
    id: string
    name: string
  }
  dataset?: {
    name: string
    visibility: 'public' | 'private'
  }
}

export async function createProjectAction(
  options: CreateProjectActionOptions,
  context: CliCommandContext,
): Promise<CreateProjectActionResult> {
  const {apiClient, prompt} = context
  const client = apiClient({requireUser: true, requireProject: false})

  // Get project name
  const projectName =
    options.projectName ||
    (options.unattended || !isInteractive
      ? 'My Sanity Project'
      : await promptForProjectName(prompt))

  // Get organization
  const organizationId = await getOrganizationId(
    context,
    undefined, // user - not needed for projects create
    options.unattended,
    options.organizationId,
  )

  // Create the project
  const createOptions: CreateProjectOptions = {
    displayName: projectName,
    organizationId,
    metadata: {
      integration: 'cli',
    },
  }

  const project = await createProject(apiClient, createOptions)

  // Get organization details for response
  let organization: {id: string; name: string} | undefined
  if (organizationId) {
    try {
      const orgs = await client.request<ProjectOrganization[]>({uri: '/organizations'})
      const org = orgs.find((o) => o.id === organizationId)
      if (org) {
        organization = {id: org.id, name: org.name}
      }
    } catch (err) {
      // Organization details are optional for response
    }
  }

  const result: CreateProjectActionResult = {
    projectId: project.projectId,
    displayName: project.displayName,
    organization,
  }

  // Optionally create dataset
  if (options.createDataset) {
    const datasetName = options.datasetName || 'production'
    const aclMode = options.datasetVisibility || 'public'

    try {
      // Use direct request to the datasets endpoint with explicit project ID
      await client.request({
        method: 'PUT',
        uri: `/projects/${project.projectId}/datasets/${datasetName}`,
        body: {aclMode},
      })

      result.dataset = {name: datasetName, visibility: aclMode}
    } catch (err) {
      // Dataset creation is optional, don't fail the whole operation
      context.output.warn(`Project created but dataset creation failed: ${err.message}`)
    }
  }

  return result
}

async function promptForProjectName(prompt: any): Promise<string> {
  return prompt.single({
    type: 'input',
    message: 'Project name:',
    default: 'My Sanity Project',
    validate(input: string) {
      if (!input || input.trim() === '') {
        return 'Project name cannot be empty'
      }

      if (input.length > 80) {
        return 'Project name cannot be longer than 80 characters'
      }

      return true
    },
  })
}
