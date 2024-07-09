import {type SanityDocument} from '@sanity/client'
import {Flex, Spinner, Stack} from '@sanity/ui'
import {type BundleDocument} from 'sanity'

import {DocumentReviewCard} from './DocumentReviewCard'

export default function ReleaseReview(props: {
  documents: SanityDocument[]
  bundle?: BundleDocument
}): JSX.Element {
  const {documents, bundle} = props

  return (
    <Stack space={4}>
      {bundle ? (
        documents.map((d) => (
          <DocumentReviewCard
            documentId={d._id}
            documentTypeName={d._type}
            key={d._id}
            bundle={bundle}
            // FIXIT
            state={'ready'}
            updatedAt={d._updatedAt}
          />
        ))
      ) : (
        <Flex padding={4} justify="center">
          <Spinner />
        </Flex>
      )}
    </Stack>
  )
}
