import debug from '../../debug'
import createProject from '../project/createProject'

export default async function getOrCreateProject({apiClient, unattended, flags, prompt}) {
  let projects
  try {
    projects = await apiClient({requireProject: false}).projects.list()
  } catch (err) {
    if (unattended) {
      return {projectId: flags.project, displayName: 'Unknown project', isFirstProject: false}
    }

    throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`)
  }

  if (projects.length === 0 && unattended) {
    throw new Error('No projects found for current user')
  }

  if (flags.project) {
    const project = projects.find(proj => proj.id === flags.project)
    if (!project && !unattended) {
      throw new Error(
        `Given project ID (${flags.project}) not found, or you do not have access to it`
      )
    }

    return {
      projectId: flags.project,
      displayName: project ? project.displayName : 'Unknown project',
      isFirstProject: false
    }
  }

  const isUsersFirstProject = projects.length === 0
  if (isUsersFirstProject) {
    debug('No projects found for user, prompting for name')
    const projectName = await prompt.single({message: 'Project name'})
    return createProject(apiClient, {displayName: projectName}).then(response => ({
      ...response,
      isFirstProject: isUsersFirstProject
    }))
  }

  debug(`User has ${projects.length} project(s) already, showing list of choices`)

  const projectChoices = projects.map(project => ({
    value: project.id,
    name: `${project.displayName} [${project.id}]`
  }))

  const selected = await prompt.single({
    message: 'Select project to use',
    type: 'list',
    choices: [{value: 'new', name: 'Create new project'}, new prompt.Separator(), ...projectChoices]
  })

  if (selected === 'new') {
    debug('User wants to create a new project, prompting for name')
    return createProject(apiClient, {
      displayName: await prompt.single({
        message: 'Your project name:',
        default: 'My Sanity Project'
      })
    }).then(response => ({
      ...response,
      isFirstProject: isUsersFirstProject
    }))
  }

  debug(`Returning selected project (${selected})`)
  return {
    projectId: selected,
    displayName: projects.find(proj => proj.id === selected).displayName,
    isFirstProject: isUsersFirstProject
  }
}
