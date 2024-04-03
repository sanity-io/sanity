import {Card, Code, Grid, Stack, Text, TextArea} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components'

const ExampleCode = styled(Code)`
  cursor: pointer;
`

const EXAMPLE_FILTER_FUNCTION = `(type, field) => field.name === 'title'`

interface FilterFieldInputOptions {
  onChange: (value: string | null) => void
  onFilter: (value: string | null) => void
  value: string | null
}

export const FilterFieldInput = forwardRef(function FilterFieldInput(
  props: FilterFieldInputOptions,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  const {value, onChange, onFilter} = props

  const handleChange = useCallback(
    (event: any) => {
      onChange(event.target.value)
    },
    [onChange],
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
        <Text size={1} weight="medium">
          Function value
        </Text>
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
