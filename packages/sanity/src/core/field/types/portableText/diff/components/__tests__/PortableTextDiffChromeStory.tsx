import {type PortableTextObject} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {Annotation} from '../Annotation'
import {Header} from '../Header'
import {InlineObject} from '../InlineObject'

const UNKNOWN_INLINE: PortableTextObject = {_key: 'inline-unknown', _type: 'unknownInline'}
const UNKNOWN_ANNOTATION: PortableTextObject = {_key: 'ann-unknown', _type: 'unknownAnnotation'}

/**
 * Chromatic sentinel for review-changes Portable Text chrome on the #15070
 * field Text path: styled Heading sizes (h1–h3) and the unknown-schema
 * fallbacks for InlineObject / Annotation (Card/dotted underline + studio
 * i18n). The populated-with-diff branches need ChangeList / Preview and stay
 * out — those are claimed by the field-diff browser tests. Copy is fixture
 * or studio locale (no timestamps).
 */
export function PortableTextDiffChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              heading sizes
            </Text>
            {/* oxlint-disable-next-line react/style-prop-object -- Header.style is the PTE level, not CSS */}
            <Header style="h1">Heading one</Header>
            {/* oxlint-disable-next-line react/style-prop-object -- Header.style is the PTE level, not CSS */}
            <Header style="h2">Heading two</Header>
            {/* oxlint-disable-next-line react/style-prop-object -- Header.style is the PTE level, not CSS */}
            <Header style="h3">Heading three</Header>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unknown inline object
            </Text>
            <Text size={1}>
              A paragraph with <InlineObject object={UNKNOWN_INLINE} path={['body']} /> inline.
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              unknown annotation
            </Text>
            <Text size={1}>
              A paragraph with{' '}
              <Annotation object={UNKNOWN_ANNOTATION} path={['body']}>
                annotated span
              </Annotation>
              .
            </Text>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
