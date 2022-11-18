import {Card, Code, Flex, Inline, Label, Stack, Text, Tooltip} from '@sanity/ui'
import React, {ReactElement} from 'react'
import {useSearchState} from '../../../../contexts/search/useSearchState'
import {getFilterDefinition} from '../../../../definitions/filters'
import type {SearchFilter} from '../../../../types'
import {getFieldFromFilter} from '../../../../utils/filterUtils'

interface FilterTooltipProps {
  children: ReactElement
  filter: SearchFilter
  visible?: boolean
}

export function FilterTooltip({children, filter, visible}: FilterTooltipProps) {
  const {
    state: {definitions, documentTypesNarrowed},
  } = useSearchState()

  const fieldDefinition = getFieldFromFilter(definitions.fields, filter)
  const filterDefinition = getFilterDefinition(definitions.filters, filter.filterType)

  return (
    <Tooltip
      content={
        <Card tone="default" radius={2} style={{maxWidth: '250px'}}>
          <Stack padding={3} space={4}>
            {/* TODO: Description */}
            {/*
            <Text muted size={0}>
              Mauris bibendum ex velit, non vulputate urna facilisis vel. Etiam consequat venenatis
              orci, eget semper risus vulputate vitae
            </Text>
            */}

            {filterDefinition?.description && (
              <Text muted size={0}>
                {filterDefinition.description}
              </Text>
            )}

            {!documentTypesNarrowed.length &&
              fieldDefinition?.documentTypes &&
              fieldDefinition.documentTypes.length > 0 && (
                <Stack space={2}>
                  <Flex align="center" gap={2}>
                    <Label muted size={0}>
                      Used in document types
                    </Label>
                    <Card padding={1} radius={2} tone="transparent">
                      <Text size={0} muted>
                        {fieldDefinition.documentTypes.length}
                      </Text>
                    </Card>
                  </Flex>
                  <Text size={0} weight="regular" muted>
                    {fieldDefinition?.documentTypes.slice(0, 10).join(', ')}
                    {fieldDefinition && fieldDefinition?.documentTypes?.length > 10 ? ` ...` : ''}
                  </Text>
                </Stack>
              )}

            {fieldDefinition && (
              <Stack space={2}>
                <Label muted size={0}>
                  Name
                </Label>
                <Inline>
                  <Card tone="caution" padding={1} radius={2}>
                    <Code size={0}>{fieldDefinition?.name}</Code>
                  </Card>
                </Inline>
              </Stack>
            )}
          </Stack>
        </Card>
      }
      disabled={!visible}
      placement="right"
      portal
    >
      {children}
    </Tooltip>
  )
}
