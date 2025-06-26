import pMap from 'p-map'

import {type CliCommandContext} from '../../types'
import {isInteractive} from '../../util/isInteractive'
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
  }
}

interface ProjectOrganization {
  id: string
  name: string
  slug: string
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
    options.organizationId,
    context,
    options.unattended,
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

      result.dataset = {name: datasetName}
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

async function getOrganizationId(
  specifiedOrgId: string | undefined,
  context: CliCommandContext,
  unattended?: boolean,
): Promise<string | undefined> {
  const {apiClient, prompt} = context
  const client = apiClient({requireUser: true, requireProject: false})

  // Get available organizations
  const organizations = await client.request<ProjectOrganization[]>({uri: '/organizations'})

  // If organization is specified, validate it
  if (specifiedOrgId) {
    const org = organizations.find((o) => o.id === specifiedOrgId || o.slug === specifiedOrgId)
    if (!org) {
      throw new Error(`Organization "${specifiedOrgId}" not found or you don't have access to it`)
    }
    return org.id
  }

  // User must have organizations to create a project
  if (organizations.length === 0) {
    throw new Error('You must be a member of at least one organization to create a project')
  }

  // Check which organizations the user has permission to attach projects to
  const withGrantInfo = await getOrganizationsWithAttachGrantInfo(organizations, context)
  const withAttach = withGrantInfo.filter(({hasAttachGrant}) => hasAttachGrant)

  if (withAttach.length === 0) {
    throw new Error('You do not have permission to create projects in any of your organizations')
  }

  // In unattended mode or non-interactive mode, use defaults without prompting
  if (unattended || !isInteractive) {
    // Use the first organization with attach permissions
    return withAttach[0].organization.id
  }

  // Build choices with permission indicators
  const choices = withGrantInfo.map(({organization, hasAttachGrant}) => ({
    value: organization.id,
    name: `${organization.name} [${organization.id}]`,
    disabled: hasAttachGrant ? false : 'Insufficient permissions',
  }))

  // Default to first organization with permissions
  const defaultChoice = withAttach[0].organization.id

  return prompt.single({
    message: 'Select organization:',
    type: 'list',
    choices,
    default: defaultChoice,
  })
}

async function hasProjectAttachGrant(orgId: string, context: CliCommandContext): Promise<boolean> {
  const requiredGrantGroup = 'sanity.organization.projects'
  const requiredGrant = 'attach'

  const client = context
    .apiClient({requireProject: false, requireUser: true})
    .withConfig({apiVersion: 'v2021-06-07'})

  try {
    const grants = await client.request({uri: `organizations/${orgId}/grants`})
    const group: {grants: {name: string}[]}[] = grants[requiredGrantGroup] || []
    return group.some(
      (resource) =>
        resource.grants && resource.grants.some((grant) => grant.name === requiredGrant),
    )
  } catch (err) {
    // If we get a 401, it means we don't have access to this organization
    // probably because of implicit membership
    if ((err as any).statusCode === 401) {
      return false
    }
    // For other errors, log them but still return false
    return false
  }
}

function getOrganizationsWithAttachGrantInfo(
  organizations: ProjectOrganization[],
  context: CliCommandContext,
): Promise<Array<{hasAttachGrant: boolean; organization: ProjectOrganization}>> {
  return pMap(
    organizations,
    async (organization) => ({
      hasAttachGrant: await hasProjectAttachGrant(organization.id, context),
      organization,
    }),
    {concurrency: 3},
  )
}
