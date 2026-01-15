import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

interface EventData {
  _id: string
  oldContent?: string
  newContent?: string
  changelog?: string[]
}

export const handler = documentEventHandler(async ({context, event}) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })

  try {
    const {_id, oldContent, newContent, changelog}: EventData = event.data

    // Validate document ID
    if (!_id) {
      console.error('Missing document ID in event data')
      return
    }

    // Validate that we have meaningful content to compare
    if (!oldContent && !newContent) {
      console.log('No content changes detected. Skipping changelog update.')
      return
    }

    // Check if content changes
    const hasContentChanges = oldContent !== newContent

    // Skip if no meaningful changes
    if (!hasContentChanges) {
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

        Compare them carefully and describe the changes in a single, concise string.

        Rules:
        - Describe only *meaningful updates* (new sections, significant rewrites, added explanations, removed material)
        - Ignore minor wording or formatting tweaks

        Format:
        - Keep it short and reader-friendly.
        - Separate multiple updates with semicolons.
        - Examples:
          - Clarified explanation of the model's limitations
          - Added more context about my process
      `,
      instructionParams: {
        oldContent: {type: 'constant', value: oldContent || ''},
        newContent: {type: 'constant', value: newContent || ''},
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
