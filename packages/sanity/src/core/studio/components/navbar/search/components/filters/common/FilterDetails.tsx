import {ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, rem, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilter} from '../../../types'
import {getFieldFromFilter} from '../../../utils/filterUtils'
import {FilterTitle} from '../../common/FilterTitle'
import {ReturnIcon} from '../icons/ReturnIcon'
import {FilterIcon} from './FilterIcon'

interface FilterDetailsProps {
  filter: SearchFilter
  showSubtitle?: boolean
}

// TODO: refactor / use idiomatic sanity/ui components
const CodeWithOverflow = styled.span`
  font-family: ${({theme}) => theme.sanity.fonts.code.family};
  font-size: ${({theme}) => rem(theme.sanity.fonts.code.sizes[0].fontSize)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export function FilterDetails({filter, showSubtitle}: FilterDetailsProps) {
  const {
    state: {definitions},
  } = useSearchState()
  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)

  return (
    <Stack space={2}>
      <Flex align="flex-start" gap={3}>
        <Box marginLeft={1}>
          <Text size={1}>
            <FilterIcon filter={filter} />
          </Text>
        </Box>
        <Stack space={3}>
          <Text size={1} weight="medium">
            <FilterTitle filter={filter} />
          </Text>
          {showSubtitle && fieldDefinition?.name && (
            <CodeWithOverflow>{fieldDefinition.name}</CodeWithOverflow>
          )}
          {/* Path */}
          {fieldDefinition?.titlePath && fieldDefinition.titlePath?.length > 1 && (
            <>
              <Flex gap={2}>
                <Text muted size={0}>
                  <ReturnIcon />
                </Text>
                <Text muted size={0}>
                  {fieldDefinition.titlePath.slice(0, -1).map((pathTitle, index) => {
                    return (
                      <React.Fragment
                        // eslint-disable-next-line react/no-array-index-key
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
                      </React.Fragment>
                    )
                  })}
                </Text>
              </Flex>
            </>
          )}
        </Stack>
      </Flex>
    </Stack>
  )
}
