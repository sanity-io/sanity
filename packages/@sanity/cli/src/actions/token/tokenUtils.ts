import {type SanityClient} from '@sanity/client'

import {debug} from '../../debug'
import {type CliPrompter} from '../../types'

export const API_VERSION = 'v2021-06-07'

export type Token = {
  id: string
  label: string
  projectUserId: string
  createdAt: string
  roles: Array<{
    name: string
    title: string
  }>
}

export type Role = {
  name: string
  title: string
  description: string
  isCustom: boolean
  projectId: string
  appliesToUsers: boolean
  appliesToRobots: boolean
}

export async function selectProject(client: SanityClient, prompt: CliPrompter): Promise<string> {
  debug('No project ID in config, fetching projects list')
  const projects = await client.projects
    .list({includeMembers: false})
    .then((allProjects) => allProjects.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

  debug(`User has ${projects.length} project(s) already, showing list of choices`)

  const projectChoices = projects.map((project) => ({
    value: project.id,
    name: `${project.displayName} [${project.id}]`,
  }))

  return prompt.single({
    message: 'Select project to use',
    type: 'list',
    choices: projectChoices,
  })
}

export async function fetchTokens(client: SanityClient, projectId: string): Promise<Token[]> {
  debug('Fetching tokens for project:', projectId)
  return client.config({apiVersion: API_VERSION}).request<Token[]>({
    uri: `/projects/${projectId}/tokens`,
    method: 'GET',
  })
}

export async function fetchRoles(client: SanityClient, projectId: string): Promise<Role[]> {
  debug('Fetching roles for project:', projectId)
  return client.config({apiVersion: API_VERSION}).request<Role[]>({
    uri: `/projects/${projectId}/roles`,
    method: 'GET',
  })
}
