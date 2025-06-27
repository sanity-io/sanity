import {type CliCommandContext} from '../../types'
import {isInteractive} from '../../util/isInteractive'
import {getOrganizationId} from '../../util/organizationUtils'
import {
  createDatasetForProject,
  createProjectWithMetadata,
  getOrganizationDetails,
  type ProjectCreationResult,
  promptAndCreateDataset,
  promptForProjectName,
} from '../../util/projectUtils'

export interface CreateProjectActionOptions {
  projectName?: string
  organizationId?: string
  createDataset?: boolean
  datasetName?: string
  datasetVisibility?: 'public' | 'private'
  unattended?: boolean
}

export type CreateProjectActionResult = ProjectCreationResult

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
  const project = await createProjectWithMetadata(apiClient, projectName, organizationId)

  // Get organization details for response
  const organization = await getOrganizationDetails(context, organizationId)

  const result: CreateProjectActionResult = {
    projectId: project.projectId,
    displayName: project.displayName,
    organization,
  }

  // Optionally create dataset
  if (options.createDataset) {
    // Use shared dataset creation logic (same as init command)
    const {name: datasetName, visibility} = await promptAndCreateDataset({
      context,
      datasetName: options.datasetName,
      datasetVisibility: options.datasetVisibility,
      unattended: options.unattended || !isInteractive,
    })

    const dataset = await createDatasetForProject(
      context,
      project.projectId,
      datasetName,
      visibility,
    )

    if (dataset) {
      result.dataset = dataset
    }
  }

  return result
}
