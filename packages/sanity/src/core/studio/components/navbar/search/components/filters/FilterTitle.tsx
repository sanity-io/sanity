import {ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, rem, Stack, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {FILTERS} from '../../config/filters'
import type {KeyedSearchFilter} from '../../types'
import {FilterIcon} from './FilterIcon'

interface FilterTitleProps {
  filter: KeyedSearchFilter
  showSubtitle?: boolean
}

// TODO: refactor / use idiomatic sanity/ui components
const CodeWithOverflow = styled.span`
  font-family: ${({theme}) => theme.sanity.fonts.code.family};
  font-size: ${({theme}) => rem(theme.sanity.fonts.code.sizes[0].fontSize)};
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export function FilterTitle({filter, showSubtitle}: FilterTitleProps) {
  const title = useMemo(() => {
    if (filter.type === 'compound') {
      return FILTERS.compound[filter.id].title
    }
    if (filter.type === 'field') {
      return filter.path[filter.path.length - 1]
    }
    return 'Unknown type'
  }, [filter])

  return (
    <Stack space={2}>
      {/* Path */}
      {filter.type === 'field' && filter.path.length > 1 && (
        <Text
          // muted
          size={0}
          style={{opacity: 0.6}}
        >
          {filter.path.slice(0, -1).map((pathTitle, index) => {
            return (
              <>
                <span key={index}>{pathTitle}</span>
                {index !== filter.path.length - 2 && (
                  <span
                    key={`${index}-icon`}
                    style={{
                      opacity: 0.75,
                      paddingLeft: '0.25em',
                      paddingRight: '0.25em',
                    }}
                  >
                    <ChevronRightIcon />
                  </span>
                )}
              </>
            )
          })}
        </Text>
      )}

      <Flex align="flex-start" gap={3}>
        <Box marginLeft={1}>
          <Text size={1}>
            <FilterIcon filter={filter} />
          </Text>
        </Box>
        <Stack space={2}>
          {/* Icon + Title */}
          <Text size={1} weight="medium">
            {title}
          </Text>
          {showSubtitle && filter.showSubtitle && (
            <CodeWithOverflow>{filter.type === 'field' ? filter.fieldPath : ''}</CodeWithOverflow>
          )}
        </Stack>
      </Flex>
    </Stack>
  )
}
