import {type CliCommandContext} from '../../types'
import {listPlatforms as queryListPlatforms, type ApiPlatform} from './queryService'

export async function listPlatforms(
  options: {json?: boolean},
  context: CliCommandContext,
): Promise<ApiPlatform[]> {
  const {output} = context

  try {
    const platforms = await queryListPlatforms(context)

    if (options.json) {
      output.print(JSON.stringify(platforms, null, 2))
      return platforms
    }

    if (platforms.length === 0) {
      output.print('No platforms found.')
      return platforms
    }

    output.print(`\nFound ${platforms.length} platform(s):\n`)

    platforms.forEach((platform) => {
      output.print(`Title: ${platform.title}`)
      if (platform.npmName) {
        output.print(`NPM: ${platform.npmName}`)
      }
      if (platform.endpoint) {
        output.print(`Endpoint: ${platform.endpoint}`)
      }
      output.print('')
    })

    return platforms
  } catch (error) {
    output.error('Failed to fetch platforms')
    process.exit(1)
  }
}
