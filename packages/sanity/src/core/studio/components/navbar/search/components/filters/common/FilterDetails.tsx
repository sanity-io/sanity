import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Text} from '@sanity/ui'
import {Fragment} from 'react'
import {Box, Flex, VStack} from 'ui5'

import {selectDefinitions} from '../../../contexts/search/searchSelectors'
import {useSearchSelector} from '../../../contexts/search/useSearchState'
import {type SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'
import {FilterTitle} from '../../common/FilterTitle'
import {FilterIcon} from './FilterIcon'

interface FilterDetailsProps {
  filter: SearchFilter
}

export function FilterDetails({filter}: FilterDetailsProps) {
  const definitions = useSearchSelector(selectDefinitions)
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <VStack gap={2}>
      {/* Path */}
      {fieldDefinition?.titlePath && fieldDefinition.titlePath?.length > 1 && (
        <Box marginLeft={4}>
          <Text muted size={0}>
            {fieldDefinition.titlePath.slice(0, -1).map((pathTitle, index) => {
              return (
                <Fragment
                  // oxlint-disable-next-line no-array-index-key
                  key={index}
                >
                  <span>{pathTitle}</span>
                  {index !== fieldDefinition.titlePath.length - 2 && (
                    <span
                      style={{
                        opacity: 0.75,
                        paddingLeft: '0.25em',
                        paddingRight: '0.25em',
                      }}
                    >
                      <ChevronRightIcon />
                    </span>
                  )}
                </Fragment>
              )
            })}
          </Text>
        </Box>
      )}

      <Flex alignItems="flex-start" gap={3}>
        <Box style={{flexShrink: 0}}>
          <Text size={1}>
            <FilterIcon filter={filter} />
          </Text>
        </Box>
        <Text size={1} weight="medium">
          <FilterTitle filter={filter} />
        </Text>
      </Flex>
    </VStack>
  )
}
