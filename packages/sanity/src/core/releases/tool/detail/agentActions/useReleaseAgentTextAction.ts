import {type ReleaseDocument} from '@sanity/client'
import {useCallback, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {buildChangesQuery, toError} from './agentActionUtils'

interface UseReleaseAgentTextActionOptions {
  release: ReleaseDocument
  instruction: string
  mergeIntoMetadata: (
    existing: ReleaseDocument['metadata'],
    generated: string,
  ) => ReleaseDocument['metadata']
}

interface UseReleaseAgentTextActionResult {
  generate: () => Promise<void>
  isGenerating: boolean
  error: Error | null
}

const CHANGES_QUERY = buildChangesQuery()

export function useReleaseAgentTextAction(
  options: UseReleaseAgentTextActionOptions,
): UseReleaseAgentTextActionResult {
  const {release, instruction, mergeIntoMetadata} = options
  const client = useClient({apiVersion: 'vX'})
  const {updateRelease} = useReleaseOperations()
  const releaseName = getReleaseIdFromReleaseDocumentId(release._id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    const run = async () => {
      const response = await client.agent.action.prompt({
        instruction,
        instructionParams: {
          changes: {
            type: 'groq',
            perspective: 'raw',
            query: CHANGES_QUERY,
            params: {releaseName},
          },
        },
      })
      const generated = typeof response === 'string' ? response : ''
      if (generated.length === 0) return
      await updateRelease({
        ...release,
        metadata: mergeIntoMetadata(release.metadata, generated),
      })
    }

    try {
      await run()
    } catch (caughtError) {
      setError(toError(caughtError))
    }

    setIsGenerating(false)
  }, [client, instruction, mergeIntoMetadata, release, releaseName, updateRelease])

  return {generate, isGenerating, error}
}
