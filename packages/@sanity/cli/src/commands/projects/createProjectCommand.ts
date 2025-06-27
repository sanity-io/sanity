import {createProjectAction} from '../../actions/project/createProjectAction'
import {type CliCommandDefinition} from '../../types'
import {printProjectCreationSuccess} from '../../util/projectUtils'

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
  --dataset [name]             Create a dataset. Prompts for name/visibility unless specified or --yes used
  --dataset-visibility <mode>  Dataset visibility: public or private
  --format <format>            Output format: table or json (default: table)
  -y, --yes                    Skip prompts and use defaults (dataset: production, visibility: public)
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
      // --dataset flag without value - let action handle prompting
      createDataset = true
      datasetName = undefined // Don't set default here
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
        datasetVisibility: datasetVisibility, // Don't default here
        unattended: y || yes,
      },
      context,
    )

    if (format === 'json') {
      context.output.print(JSON.stringify(result, null, 2))
      return
    }

    printProjectCreationSuccess(result, context)
  },
}

export default createProjectCommand
