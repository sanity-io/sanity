import {createProjectAction} from '../../actions/project/createProjectAction'
import {type CliCommandDefinition} from '../../types'

const helpText = `
Examples
  sanity projects create
  sanity projects create "My New Project"
  sanity projects create "My Project" --organization=my-org
  sanity projects create "My Project" --dataset
  sanity projects create "My Project" --dataset=staging --dataset-visibility=private
  sanity projects create "CI Project" --yes --format=json

Options
  --organization <slug|id>     Organization to create the project in
  --dataset [name]             Create a dataset after project creation. Default name: production
  --dataset-visibility <mode>  Dataset visibility (public, private). Default: public
  --format <format>            Output format (table, json). Default: table
  -y, --yes                    Skip prompts and use defaults (unattended mode)
`

const createProjectCommand: CliCommandDefinition = {
  name: 'create',
  group: 'projects',
  signature: '[PROJECT_NAME]',
  helpText,
  description: 'Create a new Sanity project',
  action: async (args, context) => {
    const [projectName] = args.argsWithoutOptions
    const {
      organization,
      dataset,
      'dataset-visibility': datasetVisibility,
      format,
      yes,
      y,
    } = args.extOptions as {
      'organization'?: string
      'dataset'?: boolean | string
      'dataset-visibility'?: 'public' | 'private'
      'format'?: string
      'yes'?: boolean
      'y'?: boolean
    }

    // Parse dataset options
    let datasetName: string | undefined
    let createDataset = false

    if (dataset === true) {
      // --dataset flag without value
      createDataset = true
      datasetName = 'production'
    } else if (typeof dataset === 'string') {
      // --dataset=name
      createDataset = true
      datasetName = dataset
    }

    const result = await createProjectAction(
      {
        projectName,
        organizationId: organization,
        createDataset,
        datasetName,
        datasetVisibility: datasetVisibility || 'public',
        unattended: y || yes,
      },
      context,
    )

    if (format === 'json') {
      context.output.print(JSON.stringify(result, null, 2))
      return
    }

    context.output.print(`Project created successfully!`)
    context.output.print(`ID: ${result.projectId}`)
    context.output.print(`Name: ${result.displayName}`)
    context.output.print(`Organization: ${result.organization?.name || 'Personal'}`)

    if (result.dataset) {
      context.output.print(`Dataset: ${result.dataset.name}`)
    }

    const {apiHost} = context
      .apiClient({
        requireProject: false,
        requireUser: false,
      })
      .config()
    // Get main hostname from the API host URL
    // Ex: api.sanity.io -> sanity.io
    // Ex: api.sanity.work -> sanity.work
    const mainHostname = new URL(apiHost).hostname.split('.').slice(-2).join('.')

    context.output.print(``)
    context.output.print(
      `Manage your project: https://www.${mainHostname}/manage/project/${result.projectId}`,
    )
  },
}

export default createProjectCommand
