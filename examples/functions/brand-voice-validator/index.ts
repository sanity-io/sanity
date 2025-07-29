import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

export const handler = documentEventHandler(async ({context, event}) => {
  const {data} = event
  const {local} = context // local is true when running locally

  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })

  const brandsWritingStyleGuide = `
# Brand Style Guide

## Voice and Tone
Keep the language casual, clear, and friendly. Speak directly to readers as "you."

- **Casual yet Professional:** Informal enough to feel personal but always trustworthy.
- **Inclusive and Welcoming:** Assume readers are curious but not experts.
- **Light-hearted and Enthusiastic:** Keep enthusiasm genuine.

## Language and Vocabulary
- **Jargon:** Use sparingly. Always briefly explain technical terms.
- **Examples:** Offer relatable, real-life analogies or scenarios.
- **Tone:** Optimistic, helpful, and down-to-earth.

## Headlines and Subheadings
- **Clear and Engaging:** Capture interest without clickbait.
- **Friendly and Informative:** Indicate clearly what readers will learn.

## Formatting and Structure
- **Short Paragraphs:** 2–3 sentences maximum for readability.
- **Bullet Points and Lists:** Use liberally to break down complex ideas clearly.
`

  try {
    const result = await client.agent.action.generate({
      noWrite: local ? true : false, // if local is true, we don't want to write to the document, just return the result for logging
      instructionParams: {
        content: {
          type: 'field',
          path: 'content',
        },
        brandsWritingStyleGuide: {
          type: 'constant',
          value: brandsWritingStyleGuide,
        },
      },
      instruction: `Examine the $content. Using the $brandsWritingStyleGuide, list specific changes that the author should make to improve the content. Start each suggestion with a dash and be concise.`,
      target: {
        path: 'suggestedChanges',
      },
      conditionalPaths: {
        defaultReadOnly: false,
      },
      documentId: data._id,
      schemaId: '_.schemas.default',
      forcePublishedWrite: true,
    })
    console.log(
      local
        ? 'Generated content suggestions (LOCAL TEST MODE - Content Lake not updated):'
        : 'Generated content suggestions:',
      result.suggestedChanges,
    )
  } catch (error) {
    console.error('Error occurred during content suggestions generation:', error)
  }
})
