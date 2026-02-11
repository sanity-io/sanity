import pMap from 'p-map'

import {type CliCommandContext} from '../types'
import {isInteractive} from './isInteractive'

export interface ProjectOrganization {
  id: string
  name: string
  slug: string
}

export interface OrganizationCreateResponse {
  id: string
  name: string
  createdByUserId: string
  slug: string | null
  defaultRoleName: string | null
  members: unknown[]
  features: unknown[]
}

export interface OrganizationWithGrant {
  hasAttachGrant: boolean
  organization: ProjectOrganization
}

export async function hasProjectAttachGrant(
  orgId: string,
  context: CliCommandContext,
): Promise<boolean> {
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
    if (err.statusCode === 401) {
      return false
    }
    // For other errors, log them but still return false
    return false
  }
}

export function getOrganizationsWithAttachGrantInfo(
  organizations: ProjectOrganization[],
  context: CliCommandContext,
): Promise<OrganizationWithGrant[]> {
  return pMap(
    organizations,
    async (organization) => ({
      hasAttachGrant: await hasProjectAttachGrant(organization.id, context),
      organization,
    }),
    {concurrency: 3},
  )
}

export function getOrganizationChoices(
  withGrantInfo: OrganizationWithGrant[],
  prompt?: any,
): any[] {
  const choices = withGrantInfo.map(({organization, hasAttachGrant}) => ({
    value: organization.id,
    name: `${organization.name} [${organization.id}]`,
    disabled: hasAttachGrant ? false : 'Insufficient permissions',
  }))

  if (prompt) {
    choices.push(
      new prompt.Separator(),
      {value: '-new-', name: 'Create new organization', disabled: false},
      new prompt.Separator(),
    )
  }

  return choices
}

export async function createOrganization(
  context: CliCommandContext,
  user?: {name: string},
  props: {name?: string} = {},
): Promise<OrganizationCreateResponse> {
  const {prompt, apiClient} = context

  const name =
    props.name ||
    (await prompt.single({
      type: 'input',
      message: 'Organization name:',
      default: user ? user.name : undefined,
      validate(input: string) {
        if (input.length === 0) {
          return 'Organization name cannot be empty'
        } else if (input.length > 100) {
          return 'Organization name cannot be longer than 100 characters'
        }
        return true
      },
    }))

  const spinner = context.output.spinner('Creating organization').start()
  const client = apiClient({requireProject: false, requireUser: true})
  const organization = await client.request({
    uri: '/organizations',
    method: 'POST',
    body: {name},
  })
  spinner.succeed()

  return organization
}

export async function promptForOrganizationSelection(
  choices: any[],
  defaultChoice: string | undefined,
  context: CliCommandContext,
): Promise<string> {
  return context.prompt.single({
    message: 'Select organization:',
    type: 'list',
    choices,
    default: defaultChoice,
  })
}

export async function getOrganization(
  context: CliCommandContext,
  user?: {name: string},
  unattended?: boolean,
  specifiedOrgId?: string,
): Promise<ProjectOrganization | undefined> {
  const {apiClient, output} = context
  const client = apiClient({requireUser: true, requireProject: false})

  // Get available organizations
  const spinner = output.spinner('Loading organizations').start()
  let organizations: ProjectOrganization[]
  try {
    organizations = await client.request<ProjectOrganization[]>({uri: '/organizations'})
  } catch (error) {
    spinner.fail()
    throw error
  }

  // If organization is specified, validate it
  if (specifiedOrgId) {
    const org = organizations.find((o) => o.id === specifiedOrgId || o.slug === specifiedOrgId)
    if (!org) {
      spinner.fail()
      throw new Error(`Organization "${specifiedOrgId}" not found or you don't have access to it`)
    }
    spinner.succeed()
    return org
  }

  // If the user has no organizations, prompt them to create one with the same name as
  // their user, but allow them to customize it if they want
  if (organizations.length === 0) {
    spinner.succeed()
    output.print('You need to create an organization to create projects.')
    return createOrganization(context, user).then((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug || org.id,
    }))
  }

  // If the user has organizations, let them choose from them, but also allow them to
  // create a new one in case they do not have access to any of them, or they want to
  // create a personal/other organization.
  const withGrantInfo = await getOrganizationsWithAttachGrantInfo(organizations, context)
  spinner.succeed()
  const withAttach = withGrantInfo.filter(({hasAttachGrant}) => hasAttachGrant)

  // In unattended mode or non-interactive mode, use defaults without prompting
  if (unattended || !isInteractive) {
    // Use the first organization with attach permissions
    return withAttach.length > 0 ? withAttach[0].organization : undefined
  }

  const organizationChoices = getOrganizationChoices(withGrantInfo, context.prompt)

  // If the user only has a single organization (and they have attach access to it),
  // we'll default to that one. Otherwise, we'll default to the organization with the
  // same name as the user if it exists.
  const defaultOrganizationId =
    withAttach.length === 1
      ? withAttach[0].organization.id
      : organizations.find((org) => org.name === user?.name)?.id

  const chosenOrg = await promptForOrganizationSelection(
    organizationChoices,
    defaultOrganizationId,
    context,
  )

  if (chosenOrg === '-new-') {
    return createOrganization(context, user).then((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug || org.id,
    }))
  }

  // Find the selected organization and return full object
  const selectedOrg = organizations.find((org) => org.id === chosenOrg)
  return selectedOrg || undefined
}
