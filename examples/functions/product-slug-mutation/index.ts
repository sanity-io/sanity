import {createClient} from '@sanity/client'
import {type DocumentEvent, documentEventHandler, type FunctionContext} from '@sanity/functions'

interface SanityProduct {
  _type: 'product'
  _id: string
  title: string
  store: {
    slug: {
      current: string
    }
  }
}

export const handler = documentEventHandler(
  async ({context, event}: {context: FunctionContext; event: DocumentEvent<SanityProduct>}) => {
    const client = createClient({
      ...context.clientOptions,
      dataset: 'production',
      useCdn: false,
    })
    const {data} = event

    try {
      const result = await client.patch(data._id, {
        set: {
          slug: {
            current: data.store.slug.current,
          },
        },
      })
      // eslint-disable-next-line no-console
      console.log('Set root slug for product:', data._id, result)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting root slug for product:', error)
    }
  },
)
