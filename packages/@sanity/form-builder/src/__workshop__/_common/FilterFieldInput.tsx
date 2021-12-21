import React, {MutableRefObject, useCallback, useMemo} from 'react'
import {Button, Card, Code, Label, Stack, TextArea} from '@sanity/ui'
import styled from 'styled-components'

const ExampleCode = styled(Code)`
  cursor: pointer;
`

const EXAMPLE_FILTER_FUNCTION = `(type, field) => field.name === 'title'`

interface FilterFieldInputOptions {
  onChange: (value) => void
  onFilter: () => void
  value: string | null
}

export const FilterFieldInput = React.forwardRef(function FilterFieldInput(
  props: FilterFieldInputOptions,
  ref: MutableRefObject<HTMLTextAreaElement>
) {
  const {value, onChange, onFilter} = props

  const handleChange = useCallback(
    (event) => {
      onChange(event.target.value)
    },
    [onChange]
  )

  const handleFilterExample = useCallback(() => {
    onChange(EXAMPLE_FILTER_FUNCTION)
  }, [onChange])

  const handleFilter = useCallback(() => {
    onFilter()
  }, [onFilter])

  const isDisabled = useMemo(() => {
    return value.length === 0
  }, [value])

  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Function value</Label>
        <TextArea rows={4} ref={ref} onChange={handleChange} value={value} />
        <ExampleCode
          title="Use example code"
          size={1}
          onClick={handleFilterExample}
        >{`Example: ${EXAMPLE_FILTER_FUNCTION}`}</ExampleCode>
        <Button text="Filter" onClick={handleFilter} disabled={isDisabled} />
      </Stack>
    </Card>
  )
})
