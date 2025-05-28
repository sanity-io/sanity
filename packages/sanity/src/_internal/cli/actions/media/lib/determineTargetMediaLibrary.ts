import {CliCommandContext} from '@sanity/cli'
import {debug} from '../../../debug'
import {filter, firstValueFrom, groupBy, mergeMap, of, toArray, zip} from 'rxjs'

/**
 * Fetch a list of available media libraries and present them to the user in a list prompt. The items
 * in the list prompt are grouped by organization id.
 */
export async function determineTargetMediaLibrary({
  apiClient,
  output,
  prompt,
}: CliCommandContext): Promise<string> {
  const client = apiClient().withConfig({apiVersion: 'vX'})
  const {projectId} = client.config()

  // Note: a more user-friendly error is displayed by CLI code that is executed before this code.
  // This function should never be executed if a project id is not defined.
  if (typeof projectId === 'undefined') {
    throw new Error('Project id is required')
  }

  debug('Fetching available media libraries')
  const spinner = output.spinner('Fetching available media libraries').start()

  const mediaLibrariesByOrganization = await firstValueFrom(
    client.observable
      .request<{
        data: {status: 'active'; id: string; organizationId: string}[]
      }>({
        uri: `/media-libraries`,
        query: {
          projectId,
        },
      })
      .pipe(
        mergeMap((response) => response.data),
        filter(({status}) => status === 'active'),
        groupBy(({organizationId}) => organizationId),
        mergeMap((group) => zip(of(group.key), group.pipe(toArray()))),
        toArray(),
      ),
  )

  spinner.succeed('[100%] Fetching available media libraries')

  return prompt.single({
    message: 'Select media library',
    type: 'list',
    choices: mediaLibrariesByOrganization.flatMap(([organizationId, mediaLibraries]) => [
      new prompt.Separator(`Organization: ${organizationId}`),
      ...mediaLibraries.map(({id}) => ({value: id, name: id})),
    ]),
  })
}
