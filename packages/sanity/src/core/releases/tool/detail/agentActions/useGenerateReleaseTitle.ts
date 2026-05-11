import {type ReleaseDocument} from '@sanity/client'

import {useReleaseAgentTextAction} from './useReleaseAgentTextAction'

const TITLE_INSTRUCTION = [
  '$changes is an array of documents that this release modifies.',
  'Each element has _type, before (the published version, or null if new), and after (the version in this release).',
  'If after._system.delete is true, the document will be unpublished.',
  '',
  'Write a release title of 4 to 8 words that captures the theme or intent of these changes.',
  'Title case. No trailing punctuation. Do not prefix with "Release:" or similar.',
  'Output only the title.',
].join('\n')

function mergeTitleIntoMetadata(
  metadata: ReleaseDocument['metadata'],
  generated: string,
): ReleaseDocument['metadata'] {
  return {...metadata, title: generated}
}

export function useGenerateReleaseTitle(release: ReleaseDocument) {
  return useReleaseAgentTextAction({
    release,
    instruction: TITLE_INSTRUCTION,
    mergeIntoMetadata: mergeTitleIntoMetadata,
  })
}
