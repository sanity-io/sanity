import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

const MAX_KEYWORD_WAIT = 5 // How many times to retry (total attempts = MAX_KEYWORD_WAIT + 1)
const KEYWORD_WAIT_MS = 1500 // Wait 1.5 seconds between checks
const languages = ['nl', 'en', 'fr', 'de']

async function waitForKeywords(
  fetchKeywords: () => Promise<string[] | undefined>,
): Promise<string[] | undefined> {
  for (let i = 0; i <= MAX_KEYWORD_WAIT; i++) {
    console.log('Waiting for keywords...', i)
    const keywords = await fetchKeywords()
    if (keywords && keywords.length > 0) {
      return keywords
    }
    if (i < MAX_KEYWORD_WAIT) {
      await new Promise((res) => setTimeout(res, KEYWORD_WAIT_MS))
    }
  }
  return undefined
}

export const handler = documentEventHandler(async ({context, event}) => {
  const mlId = context.eventResourceId
  const {_id, currentVersion} = event.data
  const detailedAssetId = currentVersion?._ref

  if (!detailedAssetId) {
    console.log('No detailedAssetId found, skipping')
    return
  }

  // Query keywords from the Media Library asset
  const fetchKeywords = async () => {
    const client = createClient({
      ...context.clientOptions,
      dataset: 'production',
      apiVersion: '2025-05-08',
    })

    try {
      const response = await client.request({
        query: {
          query: `*[_id == '${detailedAssetId}'][0]{ "keywords": metadata.keywords }`,
        },
        url: `/media-libraries/${mlId}/query`,
      })
      return response?.result?.keywords || []
    } catch (err) {
      console.error('Failed fetching keywords from asset', err)
      return []
    }
  }

  const keywords = await waitForKeywords(fetchKeywords)

  if (!keywords || keywords.length === 0) {
    console.log('No keywords found after retries, skipping')
    return
  }

  // Generate alt text based on the keywords
  const agentClient = createClient({
    ...context.clientOptions,
    dataset: 'production',
    apiVersion: 'vX',
  })

  const altTextResponse = await agentClient.agent.action.prompt({
    instruction: `Given the following keywords: [${keywords.join(', ')}], generate a JSON array of short (max 100 chars) alt text objects for each of these languages: [${languages.join(', ')}]. Each object should have this format: {"lang": "<language code>", "value": "<alt text in that language>"}. The response must be a single valid JSON array containing one object per language. Output ONLY the JSON array, nothing else.`,
  })
  console.log('Alt text generated:', JSON.stringify(altTextResponse, null, 2))

  // Strip markdown code fences if present
  const cleanedResponse = altTextResponse.replace(/^```json\s*|\s*```$/g, '').trim()

  const altTextItems = JSON.parse(cleanedResponse)

  // Convert the alt text items to an array of objects with the correct format
  const altTextItemsArray: {_key: string; _type: string; language: string; value: string}[] = []
  for (const altTextItem of altTextItems) {
    altTextItemsArray.push({
      _key: crypto.randomUUID(),
      _type: 'altTextItem',
      language: altTextItem.lang,
      value: altTextItem.value,
    })
  }
  console.log('Alt text items array:', JSON.stringify(altTextItemsArray, null, 2))

  // Patch the asset to set the alt text in the 'altText' aspect
  const url = `https://api.sanity.io/v2025-05-08/media-libraries/${mlId}/mutate`
  const mutation = JSON.stringify({
    mutations: [
      {
        patch: {
          id: _id,
          setIfMissing: {aspects: {}},
          set: {
            'aspects.altText': [...altTextItemsArray],
          },
        },
      },
    ],
  })

  console.log('Mutation payload:', mutation)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'Authorization': `Bearer ${context.clientOptions.token}`,
    },
    body: mutation,
  })

  const result = await response.json()
  console.log('Mutation response:', JSON.stringify(result, null, 2))
})
