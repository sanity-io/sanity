import {AddIcon} from '@sanity/icons/Add'
import {useQuery} from '@sanity/sdk-react'
import {Button, Card, Container, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {Suspense, useState} from 'react'
import {useClient} from 'sanity'
import {useStateLink} from 'sanity/router'

import {COLLECTION_ENTRIES_API_VERSION, COLLECTION_TYPE} from './constants'
import {buildSampleCollection} from './sampleCollection'

const COLLECTIONS_QUERY = `*[_type == $type] | order(_updatedAt desc) {
  _id,
  title,
  "entryCount": count(entries)
}`

interface CollectionSummary {
  _id: string
  title: string | null
  entryCount: number | null
}

export function CollectionDashboard() {
  const client = useClient({apiVersion: COLLECTION_ENTRIES_API_VERSION})
  const [isSeeding, setIsSeeding] = useState(false)

  async function handleCreateSample() {
    setIsSeeding(true)
    const {collection, entries} = buildSampleCollection()
    try {
      await entries
        .reduce((transaction, entry) => transaction.create(entry), client.transaction())
        .create(collection)
        .commit()
    } catch (error) {
      console.error('Failed to create the sample collection', error)
    }
    setIsSeeding(false)
  }

  return (
    <Card height="fill" overflow="auto">
      <Container width={1} paddingX={4} paddingY={5}>
        <Stack gap={5}>
          <Flex align="center" gap={3}>
            <Heading as="h1" size={2} style={{flex: 1}}>
              Collections
            </Heading>
            <Button
              icon={AddIcon}
              text="Create sample collection"
              tone="primary"
              loading={isSeeding}
              onClick={handleCreateSample}
            />
          </Flex>
          <Suspense fallback={<Spinner muted />}>
            <CollectionList />
          </Suspense>
        </Stack>
      </Container>
    </Card>
  )
}

function CollectionList() {
  const {data: collections} = useQuery<CollectionSummary[]>({
    query: COLLECTIONS_QUERY,
    params: {type: COLLECTION_TYPE},
  })

  if (collections.length === 0) {
    return <Text muted>No collections yet. Create a sample to get started.</Text>
  }

  return (
    <Stack gap={2}>
      {collections.map((collection) => (
        <CollectionRow key={collection._id} collection={collection} />
      ))}
    </Stack>
  )
}

interface CollectionRowProps {
  collection: CollectionSummary
}

function CollectionRow({collection}: CollectionRowProps) {
  const link = useStateLink({state: {collectionId: collection._id}})

  return (
    <Card as="a" href={link.href} onClick={link.onClick} border radius={2} padding={4}>
      <Stack gap={3}>
        <Text weight="semibold">{collection.title || 'Untitled collection'}</Text>
        <Text muted size={1}>
          {collection.entryCount ?? 0} entries · {collection._id}
        </Text>
      </Stack>
    </Card>
  )
}
