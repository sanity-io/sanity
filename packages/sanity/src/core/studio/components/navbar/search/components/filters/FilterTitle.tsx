import {ChevronRightIcon} from '@sanity/icons'
import {Box, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import {FILTERS} from '../../config/filters'
import type {KeyedSearchFilter} from '../../types'
import {FilterIcon} from './FilterIcon'

interface FilterTitleProps {
  filter: KeyedSearchFilter
  showSubtitle?: boolean
}

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
    <Flex align="flex-start" gap={3}>
      <Text size={1}>
        <FilterIcon filter={filter} />
      </Text>
      <Stack space={2}>
        <Text size={1} weight="medium">
          {title}
        </Text>
        {/* Path */}
        {filter.type === 'field' && filter.path.length > 1 && (
          <Text muted size={1} style={{opacity: 0.75}}>
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
        {showSubtitle && filter.showSubtitle && (
          <Code muted size={0}>
            {filter.type === 'field' ? filter.fieldPath : ''}
          </Code>
        )}
      </Stack>
    </Flex>
  )
}
