import {type CliCommandGroupDefinition} from '../../types'

const openapiGroup: CliCommandGroupDefinition = {
  name: 'openapi',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'List, browse, and retrieve Sanity OpenAPI specifications',
}

export default openapiGroup
