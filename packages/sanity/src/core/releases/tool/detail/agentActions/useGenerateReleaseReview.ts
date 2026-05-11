import {type ReleaseDocument} from '@sanity/client'
import {useCallback, useMemo, useState} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useSchema} from '../../../../hooks/useSchema'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {buildChangesQuery, toError} from './agentActionUtils'
import {parseReviewResult, type ReviewResult} from './reviewResult'

// The dialog shows unpublishes with a static label, so they need no AI commentary.
const REVIEW_CHANGES_QUERY = buildChangesQuery({excludeUnpublishes: true})

const REVIEW_INSTRUCTION = [
  '$changes is an array of documents that this release modifies.',
  'Each element has _type, before (the published version, or null if new), and after (the version in this release).',
  '',
  'Release context (use this to ground your understanding of editorial intent):',
  '- Release title: $releaseTitle',
  '- Release description: $releaseDescription',
  '- Schema type descriptions: $schemaTypeDescriptions — a JSON object mapping document type names to a human-authored description of what that type represents in this dataset. Use the description for each $changes[*]._type to understand what kind of content each document holds.',
  '',
  'An editor is reviewing the *content* of these changes. They know which release they are in and what each action is. Describe what is changing and why it matters editorially.',
  '',
  'Return a JSON object with this exact shape:',
  '{',
  '  "verdict": {',
  '    "risk": "low" | "medium" | "high",',
  '    "summary": "<one sentence on the editorial significance for readers. No technical mechanics.>"',
  '  },',
  '  "documents": [',
  '    {',
  '      "documentId": "<the _id from the changes array>",',
  '      "commentary": "<1-2 short sentences covering what is changing in the content, the editorial intent, and how it fits this release.>"',
  '    }',
  '  ]',
  '}',
  '',
  'Hard constraints on commentary and summary:',
  '- Do not mention release mechanics. Forbidden phrases: "release namespace", "mirrored into release", "moved into the release", "promoted to release", "release ID space", "version document", "in the release", "release-scoped".',
  '- Do not mention document IDs, _id fields, or any internal identifier.',
  '- Do not preface with "A new X was added" or "An existing Y was updated". The reader already sees the action.',
  '- Do not describe the publish operation.',
  '- Start with the substantive change. Examples: "Adds a new pasta chapter focused on…", "Rewrites the author bio to emphasise…", "Removes the legacy pricing section because…".',
  '- Describe the content as a reader will see it.',
  '',
  'Include one documents entry per non-unpublish element in $changes. Match documentId exactly to the _id on each input element.',
].join('\n')

export interface UseGenerateReleaseReviewResult {
  result: ReviewResult | null
  isGenerating: boolean
  error: Error | null
  generate: () => Promise<void>
}

export function useGenerateReleaseReview(release: ReleaseDocument): UseGenerateReleaseReviewResult {
  const client = useClient({apiVersion: 'vX'})
  const schema = useSchema()
  const releaseName = getReleaseIdFromReleaseDocumentId(release._id)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const releaseTitle = release.metadata.title ?? ''
  const releaseDescription = release.metadata.description ?? ''

  const schemaTypeDescriptions = useMemo(
    () => JSON.stringify(collectDocumentTypeDescriptions(schema)),
    [schema],
  )

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await client.agent.action.prompt<ReviewResult>({
        format: 'json',
        instruction: REVIEW_INSTRUCTION,
        instructionParams: {
          changes: {
            type: 'groq',
            perspective: 'raw',
            query: REVIEW_CHANGES_QUERY,
            params: {releaseName},
          },
          releaseTitle: {type: 'constant', value: releaseTitle},
          releaseDescription: {type: 'constant', value: releaseDescription},
          schemaTypeDescriptions: {type: 'constant', value: schemaTypeDescriptions},
        },
      })
      setResult(parseReviewResult(response))
    } catch (caughtError) {
      setError(toError(caughtError))
    }

    setIsGenerating(false)
  }, [client, releaseName, releaseTitle, releaseDescription, schemaTypeDescriptions])

  return {result, isGenerating, error, generate}
}

function collectDocumentTypeDescriptions(
  schema: ReturnType<typeof useSchema>,
): Record<string, string> {
  return schema.getTypeNames().reduce<Record<string, string>>((acc, typeName) => {
    const type = schema.get(typeName)
    const description = type?.description
    if (typeof description === 'string' && description.length > 0) {
      acc[typeName] = description
    }
    return acc
  }, {})
}
