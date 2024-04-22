import {type CliCommandAction} from '@sanity/cli'

const listManifests: CliCommandAction = async (_args, context) => {
  const {output} = context

  output.print('Here are the manifests for this project:')
}

export default listManifests
