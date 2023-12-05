import {Box, Flex} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {TextWithTone} from '../../../../../../components'
import {TranslateComponentMap, Translate} from '../../../../../../i18n/Translate'
import {isRecord} from '../../../../../../util'
import {useTranslation} from '../../../../../../i18n'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getOperatorDefinition} from '../../definitions/operators'
import type {SearchFilter, SearchFilterValues} from '../../types'
import {FilterTitle} from './FilterTitle'

interface FilterLabelProps {
  filter: SearchFilter
  fontSize?: number
  showContent?: boolean
}

const CustomBox = styled(Box)<{$flexShrink?: number}>`
  flex-shrink: ${({$flexShrink = 0}) => $flexShrink};
`

export function FilterLabel({filter, fontSize = 1, showContent = true}: FilterLabelProps) {
  const {t} = useTranslation()
  const {
    state: {definitions, fullscreen},
  } = useSearchState()

  const operator = getOperatorDefinition(definitions.operators, filter.operatorType)

  const ButtonValue = operator?.buttonValueComponent
  const filterValue = filter.value

  const components: TranslateComponentMap = useMemo(
    () => ({
      Field: () => (
        <CustomBox $flexShrink={fullscreen ? 1 : 0}>
          <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="semibold">
            <FilterTitle filter={filter} maxLength={fullscreen ? 25 : 40} />
          </TextWithTone>
        </CustomBox>
      ),
      Operator: ({children}) =>
        showContent ? (
          <CustomBox $flexShrink={0}>
            <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="regular">
              {children}
            </TextWithTone>
          </CustomBox>
        ) : null,
      Value: ({children}) =>
        showContent ? (
          <CustomBox $flexShrink={1}>
            <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="semibold">
              {ButtonValue ? <ButtonValue value={filterValue} /> : children}
            </TextWithTone>
          </CustomBox>
        ) : null,
    }),
    [filter, fontSize, fullscreen, showContent, ButtonValue, filterValue],
  )

  if (!operator?.descriptionKey) {
    console.warn('Missing `descriptionKey` for operator `%s`', filter.operatorType)
  }

  if (!showContent || !operator?.descriptionKey) {
    const Field = components.Field
    return (
      <Flex align="center" gap={1}>
        <Field />
      </Flex>
    )
  }

  return (
    <Flex align="center" gap={1}>
      <Translate
        t={t}
        i18nKey={operator?.descriptionKey}
        components={components}
        values={getFilterValues(filter)}
      />
    </Flex>
  )
}

function getFilterValues(filter: SearchFilter): SearchFilterValues {
  const values: SearchFilterValues = {}
  if (typeof filter.value === 'number') {
    values.count = filter.value
  }
  if (isStringOrNumber(filter.value)) {
    values.value = filter.value
  }
  if (isRecord(filter.value) && 'from' in filter.value && isStringOrNumber(filter.value.from)) {
    values.from = filter.value.from
  }
  if (isRecord(filter.value) && 'to' in filter.value && isStringOrNumber(filter.value.to)) {
    values.to = filter.value.to
  }
  return values
}

function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number'
}
