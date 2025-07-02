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
  sanity projects create "CI Project" --yes --json

Options
  --organization <slug|id>     Organization to create the project in
  --dataset [name]             Create a dataset. Prompts for name/visibility unless specified or --yes used
  --dataset-visibility <mode>  Dataset visibility: public or private
  --json                       JSON output format
  -y, --yes                    Skip prompts and use defaults (project: "My Sanity Project", dataset: production, visibility: public)
`

type CreateProjectFlags = {
  'organization'?: string
  'dataset'?: boolean | string // true means prompt for dataset name
  'dataset-visibility'?: 'public' | 'private'
  'json'?: boolean // Output in JSON format
  'yes'?: boolean // Skip prompts and use defaults
  'y'?: boolean // Alias for --yes
}

const createProjectCommand: CliCommandDefinition<CreateProjectFlags> = {
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
      json,
      yes,
      y,
    } = args.extOptions

    // Parse dataset options
    let datasetName: string | undefined
    let createDataset = false

    if (dataset === true) {
      // --dataset flag without value - let action handle prompting
      createDataset = true
      datasetName = undefined
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
        datasetVisibility: datasetVisibility,
        unattended: y || yes,
      },
      context,
    )

    printProjectCreationSuccess(result, json ? 'json' : 'text', context)
  },
}

export default createProjectCommand
