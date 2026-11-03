import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {IncomingReferenceDocument} from '../IncomingReferenceDocument'

const SCHEMA = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
]

const FIXED_TIMESTAMP = '2020-01-15T12:00:00.000Z'

const MISSING_TYPE_DOCUMENT = {
  _id: 'author-unknown',
  _type: 'missingAuthor',
  _rev: 'rev-1',
  _createdAt: FIXED_TIMESTAMP,
  _updatedAt: FIXED_TIMESTAMP,
} satisfies SanityDocument

const UNLINKED_DOCUMENT = {
  _id: 'author-1',
  _type: 'author',
  _rev: 'rev-1',
  _createdAt: FIXED_TIMESTAMP,
  _updatedAt: FIXED_TIMESTAMP,
  name: 'Ada Lovelace',
} satisfies SanityDocument

function Section(props: {label: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {props.label}
      </Text>
      {props.children}
    </VStack>
  )
}

/**
 * Incoming-reference row. Pins the critical missing-schema card (ui5 Box
 * padding on a caution Card) and the placeholder preview used when the
 * referenced path has not landed yet. Fixture documents only — no live
 * listeners or timestamps.
 */
export function IncomingReferenceDocumentStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <Section label="missing schema type">
            <IncomingReferenceDocument
              actions={undefined}
              document={MISSING_TYPE_DOCUMENT}
              referenceToId="post-1"
            />
          </Section>
          <Section label="known type, not yet linked">
            <IncomingReferenceDocument
              actions={undefined}
              document={UNLINKED_DOCUMENT}
              referenceToId="post-1"
            />
          </Section>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
