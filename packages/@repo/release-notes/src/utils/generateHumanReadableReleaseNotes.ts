import {Anthropic} from '@anthropic-ai/sdk'
import {toPlainText} from '@portabletext/toolkit'
import {readEnv} from '@repo/utils'
import {type PortableTextBlock, type SanityDocument} from '@sanity/types'
import {groupBy, upperFirst} from 'lodash-es'

import {type KnownEnvVar, type StudioChangelogEntry} from '../types'

export async function generateHumanReadableReleaseNotes({
  changelogDocument,
}: {
  changelogDocument: SanityDocument
}) {
  const changelogEntries = (changelogDocument.changelog || []) as StudioChangelogEntry[]

  const filteredEntries = changelogEntries.filter((entry) => {
    return (
      !entry.exclude &&
      (entry.type === 'feat' || entry.type === 'fix') &&
      entry.contents &&
      entry.contents.length > 0
    )
  })

  const {feat: features = [], fix: bugfixes = []} = groupBy(filteredEntries, (entry) => entry.type)

  const summary = await summarize(`## Features
  ${features.map((feature) => `- ${toPlainText(feature.contents)}`).join('\n')}
  ## Bugfixes
  ${bugfixes.map((bugfix) => `- ${toPlainText(bugfix.contents)}`).join('\n')}
`)

  return [
    summary
      ? {
          _type: 'block',
          _key: 'summary',
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: 'summary-span',
              text: summary.map((b) => (b.type == 'text' ? b.text : '')).join('\n'),
              marks: [],
            },
          ],
        }
      : [],

    features.length > 0
      ? features.flatMap((feature) => [
          {
            _type: 'block',
            _key: `feature-heading-block-${feature._key}-block`,
            style: 'h2',
            markDefs: [],
            children: [
              {
                _type: 'span',
                _key: `feature-heading-${feature._key}-span`,
                text: upperFirst(feature.subject),
                marks: [],
              },
            ],
          },
          ...feature.contents.map(convertToDocsArticleContent),
        ])
      : [],
    bugfixes.length > 0
      ? [
          {
            _type: 'block',
            _key: 'bugfixes-heading',
            style: 'h2',
            markDefs: [],
            children: [
              {
                _type: 'span',
                _key: 'fixes-heading-span',
                text: '🐛 Notable bugfixes and improvements',
                marks: [],
              },
            ],
          },
          ...bugfixes.flatMap((bugfix) =>
            bugfix.contents.map((block) =>
              convertToDocsArticleContent({
                ...block,
                style: 'normal',
                listItem: 'bullet',
                level: 1,
              }),
            ),
          ),
        ]
      : [],
  ].flat()
}

function convertToDocsArticleContent(block: PortableTextBlock) {
  if (block._type === 'code') {
    return {_type: 'codeBlock', _key: block._key, blocks: [{_key: block._key, code: block}]}
  }
  return block
}

async function summarize(changes: string) {
  const client = new Anthropic({
    apiKey: readEnv<KnownEnvVar>('RELEASE_NOTES_CLAUDE_API_KEY'),
  })

  try {
    const message = await client.messages.create({
      // eslint-disable-next-line camelcase
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Summarize the following changes in a concise manner, focusing on the most significant improvements and bug fixes. Be brief and limit the summary to a single sentence. Leave out stuff that looks technical or less important. Finish the sentence "This release…" The changes: ${changes}`,
        },
      ],
      model: 'claude-haiku-4-5',
      stream: false,
    })

    return message.content
  } catch (err) {
    console.warn(new Error('Request to Claude API failed', {cause: err}))
  }
  return null
}
