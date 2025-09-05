import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

interface CodeBlock {
  _type: 'code'
  language?: string
  highlightedLines?: number[]
  code?: string
  filename?: string
}

interface EventData {
  _id: string
  oldContent?: string
  newContent?: string
  oldCodeBlocks?: CodeBlock[]
  newCodeBlocks?: CodeBlock[]
  changelog?: string[]
}

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })

  try {
    const {_id, oldContent, newContent, oldCodeBlocks, newCodeBlocks, changelog}: EventData =
      event.data

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

    // Check if content changes
    const hasContentChanges = oldContent !== newContent

    // Check if code changes are only formatting
    const isCodeFormattingOnly = isOnlyFormattingChange(oldCode, newCode)

    // Check if code changes are not only formatting
    const hasCodeChanges = oldCode !== newCode && !isCodeFormattingOnly

    // Skip if no meaningful changes at all
    if (!hasContentChanges && !hasCodeChanges) {
      console.log('No meaningful changes detected. Skipping changelog update.')
      return
    }

    // Use Sanity's Agent Actions to generate a changelog entry based on content differences
    const result = await client.agent.action.generate({
      schemaId: '_.schemas.default',
      forcePublishedWrite: true, // Write to published document, not just draft
      documentId: _id,
      instruction: `
        You are given two versions of a blog post:
          - The "before" content: $oldContent
          - The "after" content: $newContent
          - The "before" code blocks: $oldCode
          - The "after" code blocks: $newCode
          - Code formatting flag: $isCodeFormattingOnly

          Compare them carefully and describe the changes in a single, concise string.

          Rules:
          - If $isCodeFormattingOnly is 'true', do NOT mention any code block changes at all
          - If $isCodeFormattingOnly is 'false', compare $oldCode vs. $newCode - explain *all modifications*, including syntax changes, code block additions, code block removals, logic changes
          - For **content changes** (compare $oldContent vs. $newContent), describe only *meaningful updates* (new sections, significant rewrites, added explanations, removed material). Ignore minor wording or formatting tweaks.

          Format:
          - Keep it short and reader-friendly.
          - Separate multiple updates with semicolons.
          - Examples:
            - Fixed syntax for the API call to use await
            - Added a new code block for the API call
            - Removed a code block for the API call
            - Clarified explanation of the model's limitations
            - Added more context about my process
      `,
      instructionParams: {
        oldContent: {type: 'constant', value: oldContent || ''},
        newContent: {type: 'constant', value: newContent || ''},
        oldCode: {type: 'constant', value: oldCode},
        newCode: {type: 'constant', value: newCode},
        isCodeFormattingOnly: {
          type: 'constant',
          value: isCodeFormattingOnly.toString(),
        },
      },
      target: {
        path: 'changelog',
        operation: 'append',
      },
    })

    // Compare the result with existing changelog to detect if AI made meaningful changes
    if (JSON.stringify(result.changelog) === JSON.stringify(changelog)) {
      console.log('No meaningful changes detected - changelog entry not needed')
    } else {
      console.log('Successfully generated changelog entry:', result.changelog)
    }
  } catch (error) {
    console.error('Error appending changelog entry: ', error)
  }
})

// Extract code content from Sanity code blocks for comparison
function getCodeText(blocks?: Array<CodeBlock>) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((block) => block._type === 'code' && typeof block.code === 'string')
    .map((block) => block.code)
    .join('\n\n')
}

// Check if code changes are only whitespace/formatting (should be ignored)
function isOnlyFormattingChange(oldCode: string, newCode: string): boolean {
  const normalize = (code: string) => code.replace(/\s+/g, '')
  return normalize(oldCode) === normalize(newCode)
}
