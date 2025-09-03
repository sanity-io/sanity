import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })

  try {
    const {_id, oldContent, newContent, oldCodeBlocks, newCodeBlocks, changelog} = event.data

    // Validate document ID
    if (!_id) {
      console.error('Missing document ID in event data')
      return
    }

    // Validate that we have meaningful content to compare
    if (!oldContent && !newContent && !oldCodeBlocks?.length && !newCodeBlocks?.length) {
      console.log('No content changes detected. Skipping changelog update.')
      return
    }

    const oldCode = getCodeText(oldCodeBlocks)
    const newCode = getCodeText(newCodeBlocks)

    // Only check for formatting changes if there are actually code blocks to compare
    if (
      (oldCodeBlocks?.length > 0 || newCodeBlocks?.length > 0) &&
      isOnlyFormattingChange(oldCode, newCode)
    ) {
      console.log('Code change is only formatting. Skipping changelog update.')
      return
    }

    const result = await client.agent.action.generate({
      schemaId: '_.schemas.default',
      forcePublishedWrite: true,
      documentId: _id,
      instruction: `
        You are given two versions of a blog post:
          - The "before" content: $oldContent
          - The "after" content: $newContent
          - The "before" code blocks: $oldCode
          - The "after" code blocks: $newCode

          Compare them carefully and describe the changes in a single, concise string.

          Rules:
          - For **code changes** (compare $oldCode vs. $newCode), explain *all modifications*, including minor adjustments (renaming variables, formatting, syntax changes).
          - For **content changes** (compare $oldContent vs. $newContent), describe only *meaningful updates* (new sections, significant rewrites, added explanations, removed material). Ignore minor wording or formatting tweaks.
          - If there are no meaningful changes, return nothing.

          Format:
          - Keep it short and reader-friendly.
          - Separate multiple updates with semicolons.
          - Examples:
            - Fixed syntax for the API call to use await
            - Clarified explanation of the model's limitations
            - Added more context about my process
      `,
      instructionParams: {
        oldContent: {type: 'constant', value: oldContent},
        newContent: {type: 'constant', value: newContent},
        oldCode: {type: 'constant', value: oldCode},
        newCode: {type: 'constant', value: newCode},
      },
      target: {
        path: 'changelog',
        operation: 'append',
      },
    })

    // Check if the changelog actually changed
    if (JSON.stringify(result.changelog) === JSON.stringify(changelog)) {
      console.log('Only minor changes detected - no changelog entry needed')
    } else {
      console.log('Generated changelog entry:', result.changelog)
    }
  } catch (error) {
    console.error('Error appending changelog entry: ', error)
  }
})

const getCodeText = (blocks: Array<{_type: string; code?: string}>) => {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((block) => block._type === 'code' && typeof block.code === 'string')
    .map((block) => block.code)
    .join('\n\n')
}

const isOnlyFormattingChange = (oldCode: string, newCode: string): boolean => {
  const normalize = (code: string) => code.replace(/\s+/g, '')
  return normalize(oldCode) === normalize(newCode)
}
