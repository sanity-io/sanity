import {Text} from '@sanity/ui'
import startCase from 'lodash-es/startCase.js'
import {Flex, Box, VStack} from 'ui5'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type IncomingReferencesOptions} from './types'

/**
 * @beta
 */
export function IncomingReferencesDecoration(
  props: IncomingReferencesOptions & {
    name: string
    title?: string
    description?: string
  },
) {
  const {
    onLinkDocument,
    actions,
    filter,
    filterParams,
    name,
    creationAllowed = true,
    types,
    title,
    description,
  } = props

  return (
    <VStack gap={2}>
      <Box paddingY={2}>
        <VStack gap={3}>
          <Flex alignItems="center" paddingY={1}>
            <Text as="label" weight="medium" size={1}>
              {title || startCase(name)}
            </Text>
          </Flex>

          {description && (
            <Text muted size={1}>
              {description}
            </Text>
          )}
        </VStack>
      </Box>
      <IncomingReferencesList
        name={name}
        types={types}
        onLinkDocument={onLinkDocument}
        actions={actions}
        filter={filter}
        filterParams={filterParams}
        creationAllowed={creationAllowed}
      />
    </VStack>
  )
}
