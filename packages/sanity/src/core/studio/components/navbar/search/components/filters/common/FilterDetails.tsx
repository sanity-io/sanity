import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Fragment} from 'react'
import {Text, Box, Flex, VStack, Icon} from 'ui5'

import {useSearchState} from '../../../contexts/search/useSearchState'
import {type SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'
import {FilterTitle} from '../../common/FilterTitle'
import {FilterIcon} from './FilterIcon'

interface FilterDetailsProps {
  filter: SearchFilter
}

export function FilterDetails({filter}: FilterDetailsProps) {
  const {
    state: {definitions},
  } = useSearchState()
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <VStack gap={2}>
      {/* Path */}
      {fieldDefinition?.titlePath && fieldDefinition.titlePath?.length > 1 && (
        <Box marginLeft={4}>
          <Text muted size={0} as="div" trim={true}>
            {fieldDefinition.titlePath.slice(0, -1).map((pathTitle, index) => {
              return (
                <Fragment
                  // oxlint-disable-next-line no-array-index-key
                  key={index}
                >
                  <span>{pathTitle}</span>
                  {index !== fieldDefinition.titlePath.length - 2 && (
                    <Icon
                      size={0}
                      icon={ChevronRightIcon}
                      style={{
                        opacity: 0.75,
                        paddingLeft: '0.25em',
                        paddingRight: '0.25em',
                      }}
                    />
                  )}
                </Fragment>
              )
            })}
          </Text>
        </Box>
      )}

      <Flex alignItems="flex-start" gap={3}>
        <Box style={{flexShrink: 0}}>
          <Icon size={1} icon={<FilterIcon filter={filter} />} />
        </Box>
        <Text size={1} weight="medium" as="div" trim={true}>
          <FilterTitle filter={filter} />
        </Text>
      </Flex>
    </VStack>
  )
}
