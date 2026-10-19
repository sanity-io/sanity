import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type ArrayItemError} from '../../../store/types/memberErrors'
import {ErrorItem} from '../ArrayOfObjectsInput/List/ErrorItem'
import {IncompatibleItemType} from '../ArrayOfObjectsInput/List/IncompatibleItemType'

const INVALID_OBJECT_MEMBER: ArrayItemError = {
  kind: 'error',
  key: 'invalid-object',
  index: 0,
  error: {
    type: 'INVALID_ITEM_TYPE',
    validTypes: [],
    resolvedValueType: 'legacyBlock',
    value: {_type: 'legacyBlock', title: 'Legacy block'},
  },
}

const INVALID_STRING_MEMBER: ArrayItemError = {
  kind: 'error',
  key: 'invalid-string',
  index: 1,
  error: {
    type: 'INVALID_ITEM_TYPE',
    validTypes: [],
    resolvedValueType: 'string',
    value: 'legacy-string-item',
  },
}

/**
 * Chromatic sentinel for incompatible array-item chrome after the ui5 Box
 * migration. The closed prompt pairs a Box icon gutter with a growing
 * zero-basis Box holding ellipsis text — if the migrated Box loses its
 * min-width semantics the ellipsis silently turns into overflow, so one
 * state narrows the card until the prompt actually truncates. ErrorItem
 * wraps that prompt in caution RowLayout plus Box padding. Values are
 * fixtures (menus stay closed).
 */
export function IncompatibleItemTypeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              object value
            </Text>
            <IncompatibleItemType value={{_type: 'legacyBlock', title: 'Legacy block'}} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              string value
            </Text>
            <IncompatibleItemType value="legacy-string-item" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              long type name (ellipsis)
            </Text>
            <div style={{maxWidth: 240}}>
              <IncompatibleItemType
                value={{_type: 'legacyMarketingHeroBannerWithCallToActionBlock', title: 'Legacy'}}
              />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error item (invalid object)
            </Text>
            <ErrorItem member={INVALID_OBJECT_MEMBER} onRemove={noop} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error item (invalid string)
            </Text>
            <ErrorItem member={INVALID_STRING_MEMBER} onRemove={noop} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error item (read-only)
            </Text>
            <ErrorItem member={INVALID_OBJECT_MEMBER} onRemove={noop} readOnly />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
