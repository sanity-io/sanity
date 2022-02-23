import {wrappedClient} from '../../client/wrappedClient'

export function readConfig(): {projectId: string} {
  return {projectId: wrappedClient.clientConfig.projectId}
}
