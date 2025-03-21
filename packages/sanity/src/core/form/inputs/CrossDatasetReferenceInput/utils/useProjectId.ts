import {useClient} from '../../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'

export function useProjectId(): string {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  return client.config().projectId as string
}
