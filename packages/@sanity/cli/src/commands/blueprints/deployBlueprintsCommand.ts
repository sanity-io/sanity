import {type CliCommandDefinition} from '../../types'

const helpText = `
Deploy a Blueprint to create or update a stack.

Examples
  # Deploy the current blueprint
  sanity blueprints deploy
`

const deployBlueprintsCommand: CliCommandDefinition = {
  name: 'deploy',
  group: 'blueprints',
  helpText,
  signature: '',
  description: 'Deploy a Blueprint',
  hideFromHelp: true,
  /* eslint-disable-next-line complexity, max-statements */
  async action(args, context) {
    const {apiClient, output, prompt} = context
    const {print} = output

    const client = apiClient({
      requireUser: true,
      requireProject: false,
    })
    const {token} = client.config()
    const {
      blueprintsActions: actions,
      utils: {display},
    } = await import('@sanity/runtime-cli')

    if (!token) {
      print('No API token found. Please set a token using `sanity login` first.')
      return
    }

    const {
      errors,
      projectId: configuredProjectId,
      stackId,
      parsedBlueprint,
      deployedStack,
    } = await actions.blueprint.readBlueprintOnDisk({
      getStack: true,
      token,
    })

    if (errors && errors.length > 0) {
      print(errors)
      return
    }

    if (stackId && !deployedStack) {
      print('Stack ID defined but deployed stack not found')
      return
    }

    const {resources} = parsedBlueprint || {resources: []}

    let projectId = configuredProjectId
    if (!projectId) {
      print('No Sanity Project context found in Blueprint configuration.')

      const maybeProjectId = await prompt.single({
        type: 'input',
        message: 'Enter Sanity Project ID:',
      })

      projectId = maybeProjectId
    }

    if (!projectId) {
      print('Sanity Project context is required')
      return
    }

    const auth = {token, projectId}

    let name = deployedStack?.name
    if (!name) {
      const stackName = await prompt.single({
        type: 'input',
        message: 'Enter stack name:',
        validate: (input) => input.length > 0 || 'Stack name is required',
      })

      name = stackName
    }

    if (!name) {
      print('Stack name is required')
      return
    }

    const validResources = resources?.filter((r) => r.type)
    const functionResources = validResources?.filter((r) => r.type.startsWith('sanity.function.'))

    if (functionResources?.length) {
      for (const resource of functionResources) {
        print(`Processing ${resource.name}...`)
        const result = await actions.assets.stashAsset({resource, auth})

        if (result.success && result.assetId) {
          const src = resource.src
          resource.src = result.assetId // ! this will change! for now, the API expects the assetId
          const {yellow} = display.colors
          print(`${resource.name} <${yellow(result.assetId)}>`)
          print(`   Source: ${src}`)
        } else {
          print(`   Error: ${result.error}`)
          throw new Error(`Failed to process ${resource.name}`)
        }
      }
    }

    const stackPayload = {
      name,
      projectId,
      document: {resources: validResources},
    }

    print('Deploying stack...')

    const {
      ok: deployOk,
      stack,
      error: deployError,
    } = deployedStack
      ? await actions.stacks.updateStack({stackId: deployedStack.id, stackPayload, auth})
      : await actions.stacks.createStack({stackPayload, auth})

    if (deployOk) {
      const {green, bold, yellow} = display.colors
      print(
        `${green('Success!')} Stack "${bold(stack.name)}" ${deployedStack ? 'updated' : 'created'} <${yellow(stack.id)}>`,
      )

      actions.blueprint.writeConfigFile({
        projectId,
        stackId: stack.id,
      })

      print('\nUse `sanity blueprints info` to check deployment status')
    } else {
      const {red} = display.colors
      print(`${red('Failed')} to ${deployedStack ? 'update' : 'create'} stack`)
      print(`Error: ${deployError || JSON.stringify(stack, null, 2) || 'Unknown error'}`)
    }
  },
}

export default deployBlueprintsCommand
