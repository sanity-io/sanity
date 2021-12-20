import React, {MutableRefObject, useCallback, useEffect, useState, useMemo} from 'react'
import {Button, Card, Code, Label, Stack, TextArea} from '@sanity/ui'
import styled from 'styled-components'

const ExampleCode = styled(Code)`
  cursor: pointer;
`

const EXAMPLE_FILTER_FUNCTION = `(type, field) => field.name === 'title'`

interface FilterFieldInputOptions {
  onChange: (value) => void
  value: string | null
}

export const FilterFieldInput = React.forwardRef(function FilterFieldInput(
  props: FilterFieldInputOptions,
  ref: MutableRefObject<HTMLTextAreaElement>
) {
  const {value, onChange} = props
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = useCallback(
    (event) => {
      setInternalValue(event.target.value)
    },
    [setInternalValue]
  )

  const handleFilterExample = useCallback(() => {
    setInternalValue(EXAMPLE_FILTER_FUNCTION)
  }, [setInternalValue])

  const handleFilter = useCallback(() => {
    onChange(internalValue)
  }, [onChange, internalValue])

  const isDisabled = useMemo(() => {
    return internalValue.length === 0
  }, [internalValue])

  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Function value</Label>
        <TextArea rows={4} ref={ref} onChange={handleChange} value={internalValue} />
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
