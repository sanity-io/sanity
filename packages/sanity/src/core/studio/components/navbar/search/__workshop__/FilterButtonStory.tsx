import {Card} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useId, useMemo} from 'react'
import {FilterButton} from '../components/filters/filter/FilterButton'
import {SearchProvider} from '../contexts/search/SearchProvider'
import type {SearchFieldDefinition, SearchFilter} from '../types'

export default function FilterButtonStory() {
  const fullscreen = useBoolean('Fullscreen layout', false, 'Props')
  const longValue = useBoolean('Long value', true, 'Props')

  const fieldDefinitionId = useId()

  const mockFieldDefinition: SearchFieldDefinition = {
    documentTypes: [],
    fieldPath: 'title',
    filterName: 'string',
    id: fieldDefinitionId,
    name: 'title',
    title: 'Title',
    titlePath: ['Example Object', 'This is a long field title'],
    type: 'string',
  }

  const searchFilter: SearchFilter = useMemo(() => {
    return {
      fieldId: fieldDefinitionId,
      filterName: 'string',
      operatorType: 'stringEqual',
      value: longValue
        ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis ante nisi, iaculis efficitur bibendum ut, rhoncus et nunc. Vestibulum non auctor leo. Vestibulum commodo diam imperdiet lacus ultricies, non lacinia nibh ultricies. Integer congue augue a turpis pharetra volutpat. Nullam at vehicula tortor. Ut sodales, ipsum a sodales porta, lorem odio tincidunt sapien, sed gravida dui sem eget tellus. Pellentesque sodales enim ante, fringilla facilisis augue auctor tincidunt. Aenean felis metus, iaculis sed accumsan non, commodo vitae mauris. Quisque sit amet risus nibh. Nam sed quam ut mauris luctus molestie. Quisque sit amet est elit. Nullam luctus sapien lectus, a posuere erat euismod id.'
        : 'Lorem ipsum dolor sit amet',
    }
  }, [fieldDefinitionId, longValue])

  return (
    <SearchProvider __debugFieldDefinitions={[mockFieldDefinition]} fullscreen={fullscreen}>
      <Card padding={3}>
        <FilterButton filter={searchFilter} />
      </Card>
    </SearchProvider>
  )
}
