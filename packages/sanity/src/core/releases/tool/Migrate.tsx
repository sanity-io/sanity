/* eslint-disable no-console */
import {Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {Button} from '../../../ui-components'
import {useAddonDataset} from '../../studio'

/**
 * temporary migration script and buttons to trigger it, to add slug to bundles and to remove the bundles names once merged
 */
export function MigrateBundlesSlug() {
  const {client} = useAddonDataset()
  const [loading, setLoading] = useState(false)
  const addBundlesSlug = async () => {
    if (!client) return
    try {
      setLoading(true)
      const documents = await client.fetch<
        {
          _id: string
          name: string
        }[]
      >(`*[_type == 'bundle' && !defined(slug) && defined(name)]{ _id, name }`)
      console.log('Documents to update: ', documents)
      const transaction = client.transaction()
      documents.forEach((doc) => {
        transaction.patch(doc._id, {
          set: {slug: doc.name},
        })
      })
      const updated = await transaction.commit()
      console.log('Transaction completed: ', updated)
    } catch (error) {
      console.error('Error adding bundles slug', error)
    } finally {
      setLoading(false)
    }
  }
  const removeBundlesNames = async () => {
    if (!client) return
    try {
      setLoading(true)
      const documents = await client.fetch<
        {
          _id: string
          name: string
          slug: string
        }[]
      >(`*[_type == 'bundle' && defined(slug) && defined(name)]{ _id, name, slug }`)
      console.log('Documents to update: ', documents)

      const transaction = client.transaction()
      documents.forEach((doc) => {
        if (doc.name !== doc.slug) {
          throw new Error(`Name and slug are not the same for bundle ${doc._id}`)
        }
        transaction.patch(doc._id, {
          unset: ['name'],
        })
      })
      const updated = await transaction.commit()
      console.log('Transaction completed: ', updated)
    } catch (error) {
      console.error('Error removing bundles names', error)
    } finally {
      setLoading(false)
    }
  }

  const restoreBundlesNames = async () => {
    if (!client) return
    try {
      setLoading(true)
      const documents = await client.fetch<
        {
          _id: string
          slug: string
        }[]
      >(`*[_type == 'bundle' && defined(slug) && !defined(name)]{ _id, slug }`)
      console.log('Documents to update: ', documents)
      const transaction = client.transaction()
      documents.forEach((doc) => {
        transaction.patch(doc._id, {
          set: {name: doc.slug},
        })
      })
      const updated = await transaction.commit()
      console.log('Transaction completed: ', updated)
    } catch (error) {
      console.error('Error restoring bundles names', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack padding={4} space={5}>
      <Flex gap={3}>
        <Button onClick={addBundlesSlug} text="add bundles slug" disabled={loading} />
        <Button onClick={removeBundlesNames} text="remove bundles names" disabled={loading} />
        <Button onClick={restoreBundlesNames} text="Restore bundles names" disabled={loading} />
      </Flex>
      {loading && <Text>Executing...</Text>}
      <Text>See your browser console for logs.</Text>
    </Stack>
  )
}
