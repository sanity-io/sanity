import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

interface PagePayload {
  _id: string
  _type: string
  modules?: Array<{
    _type: string
    items?: Array<{
      _type: string
      productWithVariant?: {
        product?: {
          _id: string
        }
      }
    }>
  }>
}

interface ProductWithDates {
  _id: string
  _createdAt: string
  _updatedAt: string
  title?: string
  store?: {
    title?: string
  }
}

const STALE_PRODUCT_THRESHOLD_DAYS = 30

export const handler = documentEventHandler(
  async ({context, event}: {context: any; event: DocumentEvent<PagePayload>}) => {
    console.log('📄 Page Product Age Analysis Function called at', new Date().toISOString())
    console.log('📝 Event:', event)

    try {
      const {_id, _type} = event.data as PagePayload

      if (_type !== 'page') {
        console.log('⏭️ Skipping non-page document:', _type)
        return
      }

      const client = createClient({
        ...context.clientOptions,
        dataset: 'production',
        apiVersion: '2025-06-01',
      })

      console.log('🔍 Analyzing product ages for page:', _id)

      // Fetch the page with its modules and product data in one query
      // We're intentionally showing a more complex query to demonstrate real world usage,
      // you may have additional modules/fields with product references you'd want to analyze
      const page = await client.fetch<{
        _id: string
        modules: Array<{
          _type: string
          items?: Array<{
            _type: string
            productWithVariant?: {
              product?: {
                _id: string
                _createdAt: string
                _updatedAt: string
                title?: string
                store?: {
                  title?: string
                }
              }
            }
          }>
        }>
      }>(
        `*[_id == $id][0] {
      _id,
      modules[] {
        _type,
        (_type == 'grid') => {
          items[] {
            _type,
            (_type == 'productReference') => {
              productWithVariant {
                product-> {
                  _id,
                  _createdAt,
                  _updatedAt,
                  title,
                  store {
                    title
                  }
                }
              }
            }
          }
        }
      }
    }`,
        {id: _id},
      )

      if (!page) {
        console.log('❌ Page not found:', _id)
        return
      }

      // Extract product data directly from the query result
      const products: ProductWithDates[] = []

      page.modules?.forEach((module) => {
        if (module._type === 'grid' && module.items) {
          module.items.forEach((item) => {
            if (item._type === 'productReference' && item.productWithVariant?.product) {
              const product = item.productWithVariant.product
              if (product._id && product._createdAt && product._updatedAt) {
                products.push({
                  _id: product._id,
                  _createdAt: product._createdAt,
                  _updatedAt: product._updatedAt,
                  title: product.title,
                  store: product.store,
                })
              }
            }
          })
        }
      })

      // Remove duplicates based on product ID
      const uniqueProducts = products.filter(
        (product, index, self) => index === self.findIndex((p) => p._id === product._id),
      )

      console.log(
        '📦 Found products:',
        uniqueProducts.map((p) => p._id),
      )

      if (uniqueProducts.length === 0) {
        console.log('ℹ️ No product references found in page modules')
        // Clear existing product age analysis
        await client
          .patch(_id, {
            set: {
              productAgeAnalysis: [],
            },
          })
          .commit()
        return
      }

      console.log('📊 Retrieved product data for', uniqueProducts.length, 'products')

      // Calculate age analysis
      const now = new Date()
      const productAgeAnalysis = uniqueProducts.map((product) => {
        const createdAt = new Date(product._createdAt)
        const updatedAt = new Date(product._updatedAt)

        // Primary age calculation based on creation date (more important)
        const createdAgeInDays = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
        )
        // Secondary age calculation based on last update
        const updatedAgeInDays = Math.floor(
          (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24),
        )

        // Flag as old if created more than 30 days ago
        const isOld = createdAgeInDays > 30

        return {
          _key: `product-age-${product._id}`,
          product: {
            _ref: product._id,
            _type: 'reference',
          },
          lastUpdated: product._updatedAt,
          createdAt: product._createdAt,
          ageInDays: createdAgeInDays, // Primary age based on creation
          updatedAgeInDays, // Secondary age based on last update
          isOld,
        }
      })

      // Sort by age (oldest first)
      productAgeAnalysis.sort((a, b) => b.ageInDays - a.ageInDays)

      console.log('📈 Product age analysis:', {
        totalProducts: productAgeAnalysis.length,
        oldProducts: productAgeAnalysis.filter((p) => p.isOld).length,
        averageAge: Math.round(
          productAgeAnalysis.reduce((sum, p) => sum + p.ageInDays, 0) / productAgeAnalysis.length,
        ),
      })

      // Update the page with the product age analysis
      await client
        .patch(_id, {
          set: {
            productAgeAnalysis,
          },
        })
        .commit()

      console.log('✅ Page product age analysis completed:', {
        pageId: _id,
        productsAnalyzed: productAgeAnalysis.length,
        oldProductsFound: productAgeAnalysis.filter((p) => p.isOld).length,
      })
    } catch (error) {
      console.error('❌ Error processing product:', error)
      throw error
    }
  },
)
