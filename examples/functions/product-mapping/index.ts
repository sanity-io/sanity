import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'

interface ShopifyPayload {
  _id: string
  _type: string
  store?: {
    tags?: string[] | string
    slug?: {
      current: string
    }
  }
}

export const handler = documentEventHandler(async ({context, event}) => {
  console.log('👋 Your Sanity Function was called at', new Date().toISOString())
  console.log('👋 Event:', event)

  try {
    const {_id, _type, store} = event.data as ShopifyPayload

    if (_type !== 'product') {
      console.log('⏭️ Skipping non-product document:', _type)
      return
    }

    const client = createClient({
      ...context.clientOptions,
      useCdn: false,
      apiVersion: '2025-06-01',
    })

    let productMapRef: string | null = null
    let colorVariantRef: string | null = null

    if (!store?.tags) {
      console.log('ℹ️ No tags found for product:', _id, '- skipping tag processing')
      // Continue with the function instead of returning
    } else {
      // Handle tags that might come as a string or array
      let tags: string[] = []
      if (Array.isArray(store.tags)) {
        tags = store.tags
      } else if (typeof store.tags === 'string') {
        // Split comma-separated tags and trim whitespace
        tags = store.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      } else {
        console.log('⏭️ Tags format not recognized for product:', _id, 'Tags:', store.tags)
        // Continue with the function instead of returning
      }

      if (tags.length > 0) {
        console.log('🏷️ Processing tags for product:', _id, 'Tags:', tags)

        // Process sanity-parent- tags
        const parentTags = tags.filter((tag) => tag.startsWith('sanity-parent-'))
        console.log('📦 Processing parent tags:', parentTags)

        for (const tag of parentTags) {
          const productMapName = tag.replace('sanity-parent-', '')
          const productMapId = `productMap-${productMapName}`
          console.log(
            '🔄 Processing parent tag:',
            tag,
            '-> ProductMap:',
            productMapName,
            'ID:',
            productMapId,
          )

          // Check if productMap already exists by _id
          const existingProductMap = await client.fetch<{
            _id: string
            products?: Array<{_ref: string}>
          } | null>(`*[_id == $id][0]`, {id: productMapId})

          if (existingProductMap) {
            // Update existing productMap - append this product to products array
            productMapRef = existingProductMap._id
            console.log('📝 Updating existing productMap:', productMapName, 'with product:', _id)

            // Check if product already exists in the products array
            const existingProducts = existingProductMap.products || []
            const productAlreadyExists = existingProducts.some((product) => product._ref === _id)

            if (!productAlreadyExists) {
              await client
                .patch(existingProductMap._id, {
                  set: {
                    products: [
                      ...existingProducts,
                      {_key: `product-${_id}-${Date.now()}`, _ref: _id, _type: 'reference'},
                    ],
                  },
                })
                .commit()
              console.log('✅ Added product to existing productMap:', productMapName)
            } else {
              console.log(
                'ℹ️ Product already exists in productMap:',
                productMapName,
                '- skipping duplicate',
              )
            }
          } else {
            // Create new productMap with specific _id
            console.log('🆕 Creating new productMap:', productMapName, 'with ID:', productMapId)
            try {
              const newProductMap = await client.create({
                _id: productMapId,
                _type: 'productMap',
                id: productMapName,
                products: [{_key: `product-${_id}`, _ref: _id, _type: 'reference'}],
                description: `Product map for ${productMapName}`,
                careInstructions: [],
              })
              productMapRef = newProductMap._id
              console.log('✅ Created productMap:', productMapName, 'with ID:', newProductMap._id)

              // Verify the document was actually created
              const verifyProductMap = await client.fetch<{_id: string} | null>(
                `*[_id == $id][0]`,
                {id: productMapId},
              )

              if (!verifyProductMap) {
                console.error(
                  '❌ Failed to create productMap:',
                  productMapName,
                  'ID:',
                  productMapId,
                )
                productMapRef = null
              }
            } catch (error) {
              console.error('❌ Error creating productMap:', productMapName, error)
              productMapRef = null
            }
          }
        }

        // Process sanity-color- tags
        const colorTags = tags.filter((tag) => tag.startsWith('sanity-color-'))
        console.log('🎨 Processing color tags:', colorTags)

        for (const tag of colorTags) {
          const colorName = tag.replace('sanity-color-', '')
          const colorVariantId = `colorVariant-${colorName}`
          console.log(
            '🔄 Processing color tag:',
            tag,
            '-> Color:',
            colorName,
            'ID:',
            colorVariantId,
          )

          try {
            // Check if colorVariant already exists by _id
            const existingColorVariant = await client.fetch<{_id: string} | null>(
              `*[_id == $id][0]`,
              {id: colorVariantId},
            )

            if (existingColorVariant) {
              colorVariantRef = existingColorVariant._id
              console.log(
                '📝 Using existing colorVariant:',
                colorName,
                'ID:',
                existingColorVariant._id,
              )
            } else {
              // Create new colorVariant with specific _id
              console.log('🆕 Creating new colorVariant:', colorName, 'with ID:', colorVariantId)
              const newColorVariant = await client.create({
                _id: colorVariantId,
                _type: 'colorVariant',
                colorName: colorName,
                // colorValue will be set manually or via AI later
              })
              colorVariantRef = newColorVariant._id
              console.log('✅ Created colorVariant:', colorName, 'with ID:', newColorVariant._id)

              // Verify the document was actually created
              const verifyColorVariant = await client.fetch<{_id: string} | null>(
                `*[_id == $id][0]`,
                {id: colorVariantId},
              )

              if (!verifyColorVariant) {
                console.error('❌ Failed to create colorVariant:', colorName, 'ID:', colorVariantId)
                colorVariantRef = null
              }
            }
          } catch (error) {
            console.error('❌ Error processing color tag:', colorName, error)
            colorVariantRef = null
          }
        }
      }
    }

    // Update the product document with references
    const updateFields: any = {}

    if (productMapRef) {
      // Verify productMap still exists before referencing
      const verifyProductMap = await client.fetch<{_id: string} | null>(`*[_id == $id][0]`, {
        id: productMapRef,
      })
      if (verifyProductMap) {
        updateFields.productMap = {_ref: productMapRef, _type: 'reference'}
        console.log('✅ Verified productMap reference:', productMapRef)
      } else {
        console.error('❌ ProductMap no longer exists:', productMapRef)
      }
    }

    if (colorVariantRef) {
      // Verify colorVariant still exists before referencing
      const verifyColorVariant = await client.fetch<{_id: string} | null>(`*[_id == $id][0]`, {
        id: colorVariantRef,
      })
      if (verifyColorVariant) {
        updateFields.colorVariant = {_ref: colorVariantRef, _type: 'reference'}
        console.log('✅ Verified colorVariant reference:', colorVariantRef)
      } else {
        console.error('❌ ColorVariant no longer exists:', colorVariantRef)
      }
    }

    if (Object.keys(updateFields).length > 0) {
      console.log('🔄 Updating product with verified references:', updateFields)
      await client
        .patch(_id, {
          set: updateFields,
        })
        .commit()
      console.log('✅ Product updated successfully')
    } else {
      console.log('ℹ️ No valid references to update for product')
    }

    console.log('✅ Product processing completed:', {
      productId: _id,
      productMapRef,
      colorVariantRef,
    })
  } catch (error) {
    console.error('❌ Error processing product:', error)
    throw error
  }
})
