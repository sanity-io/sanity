import {Box, Flex, Stack, Text} from '@sanity/ui'
import {startCase} from 'lodash-es'

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
    name: fieldName,
    creationAllowed = true,
    types,
    title,
    description,
  } = props

  return (
    <Stack space={2}>
      <Box paddingY={2}>
        <Stack space={3}>
          <Flex align="center" paddingY={1}>
            <Text as="label" weight="medium" size={1}>
              {title || startCase(fieldName)}
            </Text>
          </Flex>

          {description && (
            <Text muted size={1}>
              {description}
            </Text>
          )}
        </Stack>
      </Box>
      <IncomingReferencesList
        fieldName={fieldName}
        types={types}
        onLinkDocument={onLinkDocument}
        actions={actions}
        filter={filter}
        filterParams={filterParams}
        creationAllowed={creationAllowed}
      />
    </Stack>
  )
}
