import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {TextWithTone} from '../../../../../../components/textWithTone/TextWithTone'
import {useTranslation} from '../../../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../../../i18n/Translate'
import {type TFunction} from '../../../../../../i18n/types'
import {isRecord} from '../../../../../../util/isRecord'
import {useSearchState} from '../../contexts/search/useSearchState'
import {getOperatorDefinition, type SearchOperatorDefinition} from '../../definitions/operators'
import {type SearchFilter, type SearchFilterValues} from '../../types'
import {FilterTitle} from './FilterTitle'

interface FilterLabelProps {
  filter: SearchFilter
  fontSize?: number
  showContent?: boolean
}

const CustomBox = styled(Box)<{$flexShrink?: number}>`
  flex-shrink: ${({$flexShrink = 0}) => $flexShrink};
`

interface FilterLabelComponentProps {
  children?: ReactNode
  buttonValueComponent?: SearchOperatorDefinition['buttonValueComponent']
  filter: SearchFilter
  filterValue?: SearchFilter['value']
  fontSize: number
  fullscreen?: boolean
  showContent?: boolean
}

function Field({filter, fontSize, fullscreen}: FilterLabelComponentProps) {
  return (
    <CustomBox $flexShrink={fullscreen ? 1 : 0}>
      <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="medium">
        <FilterTitle filter={filter} maxLength={fullscreen ? 25 : 40} />
      </TextWithTone>
    </CustomBox>
  )
}

function Operator({children, fontSize, showContent}: FilterLabelComponentProps) {
  if (!showContent) return null
  return (
    <CustomBox $flexShrink={0}>
      <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="regular">
        {children}
      </TextWithTone>
    </CustomBox>
  )
}

function Value({
  buttonValueComponent: ButtonValue,
  children,
  filterValue,
  fontSize,
  showContent,
}: FilterLabelComponentProps) {
  if (!showContent) return null
  return (
    <CustomBox $flexShrink={1}>
      <TextWithTone tone="default" size={fontSize} textOverflow="ellipsis" weight="medium">
        {ButtonValue ? <ButtonValue value={filterValue} /> : children}
      </TextWithTone>
    </CustomBox>
  )
}

export function FilterLabel({filter, fontSize = 1, showContent = true}: FilterLabelProps) {
  const {t} = useTranslation()
  const {
    state: {definitions, fullscreen},
  } = useSearchState()

  const operator = getOperatorDefinition(definitions.operators, filter.operatorType)

  const componentProps: FilterLabelComponentProps = {
    buttonValueComponent: operator?.buttonValueComponent,
    filter,
    filterValue: filter.value,
    fontSize,
    fullscreen,
    showContent,
  }

  if (!operator?.descriptionKey) {
    console.warn('Missing `descriptionKey` for operator `%s`', filter.operatorType)
  }

  if (!showContent || !operator?.descriptionKey) {
    return (
      <Flex alignItems="center" gap={1}>
        <Field {...componentProps} />
      </Flex>
    )
  }

  return (
    <Flex alignItems="center" gap={1}>
      <Translate
        t={t}
        i18nKey={operator?.descriptionKey}
        components={{Field, Operator, Value}}
        componentProps={componentProps}
        values={getFilterValues(filter, t)}
      />
    </Flex>
  )
}

function getFilterValues(filter: SearchFilter, t: TFunction): SearchFilterValues {
  const values: SearchFilterValues = {}
  if (typeof filter.value === 'number') {
    values.count = filter.value
  }
  if (isStringOrNumber(filter.value)) {
    values.value = filter.value
  }
  if (typeof filter.value === 'boolean') {
    // Cast boolean into a string value
    values.value = filter.value ? t('search.filter-boolean-true') : t('search.filter-boolean-false')
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
