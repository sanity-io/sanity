const helpText = `
Options
  --id <project-id> Project ID

Examples
  # Set the Studio URL for the current project
  sanity projects studioHostUrl https://example.com

  # Set the Studio URL of a project by ID
  sanity projects studioHostUrl --id=123 https://example.com
`

export default {
  name: 'studioHostUrl',
  group: 'projects',
  signature: '',
  helpText,
  description: 'Set the Studio URL shown in the Sanity project management UI',
  action: async (args, context) => {
    const {apiClient, output, chalk} = context
    const flags = {...args.extOptions}
    const client = apiClient({
      requireUser: true,
      requireProject: false
    })

    let spinner
    let projects
    let project

    // Show error if no URL is provided
    if (!args.argsWithoutOptions[0]) {
      return output.error(chalk.red(`Please provide the new URL for your Studio.`))
    }

    // Start spinner to fetch projects
    spinner = output.spinner('Fetching project...').start()

    try {
      projects = await client.request({
        method: 'GET',
        uri: '/projects'
      })
    } catch (error) {
      spinner.fail()
      return output.error(chalk.red(error))
    }

    // TODO: add an unset flag
    if (flags.unset) {
      // Unset the URL
      if (flags.id) {
        // reset externalStudioHost url of project with this ID
      } else {
        // reset host url of current project
      }
    }

    // If an id flag is provided, use that ID
    if (flags.id) {
      // Check if a project with this ID exists
      project = projects.find(prj => prj.id === flags.id)
      if (!project) {
        spinner.fail()
        return output.error(chalk.red(`No project with the provided ID exists.`))
      }
    } else {
      // If no id flag is provided, use the current project ID
      project = projects.find(prj => prj.id === client.config().projectId)
      if (!project) {
        spinner.fail()
        return output.error(
          chalk.red(
            'Project not found. Please make sure you are in your project folder, or provide an ID by using the --id flag.'
          )
        )
      }
    }

    spinner.succeed()
    // If we have a project ID, start setting the new studio url
    spinner = output.spinner('Setting the studio URL...').start()
    const options = {
      metadata: {...project.metadata, externalStudioHost: args.argsWithoutOptions[0]}
    }
    try {
      const result = await client.request({
        method: 'PATCH',
        uri: `/projects/${project.id}`,
        body: options
      })
      spinner.succeed()
      return output.print(
        `${chalk.green('Success!')} Studio URL set to ${result.metadata.externalStudioHost}.`
      )
    } catch (error) {
      spinner.fail()
      return output.error(chalk.red(error))
    }
  }
}
