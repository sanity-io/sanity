import debug from '../../debug'
import createProject from '../project/createProject'

export default async function prepareFlags(flags, {apiClient, output}) {
  const unattended = flags.y || flags.yes
  const createProjectName = flags['create-project']
  const newFlags = {...flags}

  if (flags.project && createProjectName) {
    throw new Error('Both `--project` and `--create-project` specified, only a single is supported')
  }

  if (createProjectName === true) {
    throw new Error('Please specify a project name (`--create-project <name>`)')
  }

  if (typeof createProjectName === 'string' && createProjectName.trim().length === 0) {
    throw new Error('Please specify a project name (`--create-project <name>`)')
  }

  if (unattended) {
    debug('Unattended mode, validating required options')
    const requiredForUnattended = ['dataset', 'output-path']
    requiredForUnattended.forEach(flag => {
      if (!flags[flag]) {
        throw new Error(`\`--${flag}\` must be specified in unattended mode`)
      }
    })

    if (!flags.project && !createProjectName) {
      throw new Error(
        '`--project <id>` or `--create-project <name>` must be specified in unattended mode'
      )
    }
  }

  if (createProjectName) {
    debug('--create-project specified, creating a new project')
    const createdProject = await createProject(apiClient, {
      displayName: createProjectName.trim()
    })
    debug('Project with ID %s created', createdProject.projectId)

    if (flags.dataset) {
      debug('--dataset specified, creating dataset (%s)', flags.dataset)
      const client = apiClient({api: {projectId: createdProject.projectId}})
      const spinner = output.spinner('Creating dataset').start()
      await client.datasets.create(flags.dataset)
      spinner.succeed()
    }

    newFlags.project = createdProject.projectId
    delete newFlags['create-project']
  }

  return flags
}
