/* eslint-disable max-statements */
/* eslint-disable max-depth */
const helpText = `
Options
  --id=<project-id> Specify a project by ID
  --unset Unset the external studio URL

Examples
  # Set the external studio URL for the current project
  sanity projects externalStudioUrl <studio-url>

  # Set the external studio URL for a specific project
  sanity projects externalStudioUrl --id=<project-id> <studio-url>

  # Unset the external studio URL for the current project
  sanity projects externalStudioUrl --unset

  # Unset the external studio URL for a specific project
  sanity projects externalStudioUrl --id=<project-id> --unset
`

export default {
  name: 'externalStudioUrl',
  group: 'projects',
  signature: '',
  helpText,
  description: 'Add an external studio URL to a project in the Sanity project management UI',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const flags = {...args.extOptions}
    const client = apiClient({
      requireUser: true,
      requireProject: false
    })

    let spinner
    let projects

    spinner = output.spinner('Getting project info...').start()

    // Fetch all projects
    try {
      projects = await fetchProjects(client)
    } catch (error) {
      spinner.fail()
      return output.error(chalk.red(error))
    }

    // Get the project we want to change the external studio URL for
    const project = flags.id
      ? findProjectById(flags.id, projects)
      : findProjectById(client.config().projectId, projects)

    // Show error message if no project with that ID exists
    if (!project) {
      spinner.fail()
      return output.error(chalk.red(`No project with the provided ID exists.`))
    }

    // Show spinner success if project exists
    spinner.succeed()

    // Unset the externalStudioHost url if --unset flag is used
    if (flags.unset) {
      spinner = output.spinner(`Updating project...`).start()
      try {
        await patchProjectMetadata(client, project, null)
        spinner.succeed()
        return output.print(`${chalk.green('Success! External studio URL was unset.')}`)
      } catch (error) {
        spinner.fail()
        return output.error(chalk.red(error))
      }
    }

    // Show error message if no URL is provided
    if (!args.argsWithoutOptions[0]) {
      return output.error(chalk.red(`Error! Please provide a URL for your Studio.`))
    }

    // Set the new external studio url
    spinner = output.spinner(`Updating project...`).start()

    try {
      const result = await patchProjectMetadata(client, project, args.argsWithoutOptions[0])
      spinner.succeed()
      return output.print(
        chalk.green(`Success! External studio URL set to ${result.metadata.externalStudioHost}`)
      )
    } catch (error) {
      spinner.fail()
      return output.error(chalk.red(error))
    }
  }
}

async function fetchProjects(client) {
  try {
    const projects = await client.request({
      method: 'GET',
      uri: '/projects'
    })
    return projects
  } catch (error) {
    return error
  }
}

function findProjectById(id, projects) {
  return projects.find(prj => prj.id === id)
}

function patchProjectMetadata(client, project, url) {
  const options = {
    metadata: {...project.metadata, externalStudioHost: url}
  }
  return client.request({
    method: 'PATCH',
    uri: `/projects/${project.id}`,
    body: options
  })
}
