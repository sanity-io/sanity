import {ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, rem, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import type {SearchFilter} from '../../../types'
import {ReturnIcon} from '../icons/ReturnIcon'
import {FilterIcon} from './FilterIcon'
import {FilterTitle} from '../../common/FilterTitle'

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
          {showSubtitle && filter.fieldPath && (
            <CodeWithOverflow>{filter.fieldPath}</CodeWithOverflow>
          )}
          {/* Path */}
          {filter.titlePath && filter.titlePath?.length > 1 && (
            <>
              <Flex gap={2}>
                <Text muted size={0}>
                  <ReturnIcon />
                </Text>
                <Text muted size={0}>
                  {filter.titlePath.slice(0, -1).map((pathTitle, index) => {
                    return (
                      <React.Fragment
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        <span>{pathTitle}</span>
                        {index !== filter.titlePath.length - 2 && (
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
