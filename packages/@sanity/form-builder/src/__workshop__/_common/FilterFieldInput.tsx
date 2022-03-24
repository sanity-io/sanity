import React, {useCallback, useMemo} from 'react'
import {Box, Button, Card, Code, Flex, Grid, Label, Stack, TextArea} from '@sanity/ui'
import styled from 'styled-components'

const ExampleCode = styled(Code)`
  cursor: pointer;
`

const EXAMPLE_FILTER_FUNCTION = `(type, field) => field.name === 'title'`

interface FilterFieldInputOptions {
  onChange: (value: string | null) => void
  onFilter: (value: string | null) => void
  value: string | null
}

export const FilterFieldInput = React.forwardRef(function FilterFieldInput(
  props: FilterFieldInputOptions,
  ref: React.ForwardedRef<HTMLTextAreaElement>
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
    onFilter(value)
  }, [onFilter, value])

  const handleReset = useCallback(() => {
    onFilter(``)
  }, [onFilter])

  const isDisabled = useMemo(() => {
    return value?.length === 0
  }, [value])

  return (
    <Card padding={4} tone="default" border>
      <Stack space={4}>
        <Label size={0}>Function value</Label>
        <TextArea rows={4} ref={ref} onChange={handleChange} value={value || ''} />
        <ExampleCode
          title="Use example code"
          size={1}
          onClick={handleFilterExample}
        >{`Example: ${EXAMPLE_FILTER_FUNCTION}`}</ExampleCode>
        <Grid columns={2} gap={3}>
          <Button text="Filter" onClick={handleFilter} disabled={isDisabled} />
          <Button text="Reset" mode="ghost" onClick={handleReset} disabled={isDisabled} />
        </Grid>
      </Stack>
    </Card>
  )
})
