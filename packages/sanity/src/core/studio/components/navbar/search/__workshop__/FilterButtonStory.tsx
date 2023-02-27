import {Card, Text} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {FilterButton} from '../components/filters/filter/FilterButton'
import {SearchProvider} from '../contexts/search/SearchProvider'
import {useSearchState} from '../contexts/search/useSearchState'
import type {SearchFilter} from '../types'

export default function FilterButtonStory() {
  const fullscreen = useBoolean('Fullscreen layout', false, 'Props')

  return (
    <SearchProvider fullscreen={fullscreen}>
      <FilterButtonContent />
    </SearchProvider>
  )
}

function FilterButtonContent() {
  const {state} = useSearchState()
  const definitions = state.definitions

  const longValue = useBoolean('Long value', true, 'Props')

  // Create filter from the first available field definition, if available
  const searchFilter: SearchFilter | null = useMemo(() => {
    const firstFieldId = definitions.fields[0]?.id
    if (!firstFieldId) {
      return null
    }
    return {
      fieldId: firstFieldId,
      filterName: 'string',
      operatorType: 'stringEqual',
      value: longValue
        ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ante nisi, iaculis efficitur bibendum ut, rhoncus et nunc. Vestibulum non auctor leo. Vestibulum commodo diam imperdiet lacus ultricies, non lacinia nibh ultricies. Integer congue augue a turpis pharetra volutpat. Nullam at vehicula tortor. Ut sodales, ipsum a sodales porta, lorem odio tincidunt sapien, sed gravida dui sem eget tellus. Pellentesque sodales enim ante, fringilla facilisis augue auctor tincidunt. Aenean felis metus, iaculis sed accumsan non, commodo vitae mauris. Quisque sit amet risus nibh. Nam sed quam ut mauris luctus molestie. Quisque sit amet est elit. Nullam luctus sapien lectus, a posuere erat euismod id.'
        : 'Lorem ipsum dolor sit amet',
    }
  }, [definitions.fields, longValue])

  return (
    <Card padding={3}>
      {searchFilter ? (
        <FilterButton filter={searchFilter} />
      ) : (
        <Text muted size={1}>
          No available fields found
        </Text>
      )}
    </Card>
  )
}
