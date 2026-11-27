import {defineField, type FieldDefinition} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {ReleaseMetadataForm} from '../ReleaseMetadataForm'

const METADATA_FIELDS: FieldDefinition[] = [
  defineField({
    name: 'legalReview',
    title: 'Legal review',
    type: 'string',
    options: {
      list: [
        {title: 'Not reviewed', value: 'notReviewed'},
        {title: 'Reviewed', value: 'reviewed'},
      ],
    },
  }),
  defineField({
    name: 'owner',
    title: 'Owner',
    type: 'string',
  }),
]

const METADATA = {
  releaseType: 'asap' as const,
  legalReview: 'reviewed',
  owner: 'Ada Lovelace',
}

const NOOP = () => undefined

const releaseMetadataPlugin = {
  name: 'story-release-metadata',
  releases: {metadata: {fields: METADATA_FIELDS}},
}

function MetadataFormCard({readOnly = false}: {readOnly?: boolean}) {
  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <ReleaseMetadataForm
        commitInitialValues={false}
        metadata={METADATA}
        onChange={NOOP}
        readOnly={readOnly}
      />
    </Card>
  )
}

/**
 * Chromatic sentinel for the configured release metadata form added with
 * variants. Title and description keep their own controls; these string
 * fields use the studio form with the dialog gutter suppressed and a
 * tighter stack gap. Values are fixtures so validation does not rewrite
 * them after mount. Grid harness for the co-located Storybook CSF file.
 */
export function ReleaseMetadataFormStory({readOnly = false}: {readOnly?: boolean}) {
  return (
    <TestWrapper
      betaFeatures={{variants: {enabled: true}}}
      plugins={[releaseMetadataPlugin]}
      schemaTypes={[]}
    >
      {readOnly ? (
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              read only
            </Text>
            <MetadataFormCard readOnly />
          </VStack>
        </VStack>
      ) : (
        <MetadataFormCard />
      )}
    </TestWrapper>
  )
}
