import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type ComponentType, useMemo, useState} from 'react'

import {useSearchState} from '../../../packages/sanity/src/core/studio/components/navbar/search/contexts/search/useSearchState'
import {type SearchFieldDefinition} from '../../../packages/sanity/src/core/studio/components/navbar/search/definitions/fields'
import {type OperatorInputComponentProps} from '../../../packages/sanity/src/core/studio/components/navbar/search/definitions/operators/operatorTypes'
import {SearchHarness, WithSearchProviders} from './searchHarness'

/**
 * Harness for a single filter operator input.
 *
 * An operator input is the small control you get after choosing a field and an operator: the text
 * box for `title contains`, the two date pickers for `publishedAt is between`, the reference
 * autocomplete for `author is`. There are around a dozen of them serving roughly fifty operators,
 * and they all implement the same three-prop contract:
 *
 *   `{fieldDefinition?: SearchFieldDefinition, value: T | null, onChange: (value: T | null) => void}`
 *
 * That contract is the thing worth teaching, so the harness makes it visible: it owns the value in
 * local state and prints what the input emits underneath. An operator input's whole job is to turn
 * a gesture into a value the filter can carry, and you cannot see whether it does that job by
 * looking at it - only by watching what comes out.
 *
 * Every input calls `useSearchState()`, so they must render inside a `SearchProvider`; use
 * {@link WithFilterProviders} as the story decorator.
 */

export const WithFilterProviders = WithSearchProviders

/**
 * Resolve a real field definition out of the search state by field path (e.g. `title`,
 * `publishedAt`, `author`). Field definitions are derived from the schema by the provider, so
 * these are the genuine ones the studio would hand the input, not hand-written stand-ins.
 */
export function useFixtureFieldDefinition(fieldPath?: string): SearchFieldDefinition | undefined {
  const {
    state: {
      definitions: {fields},
    },
  } = useSearchState()
  return useMemo(() => {
    if (!fieldPath) return undefined
    return Object.values(fields).find((field) => field.fieldPath === fieldPath)
  }, [fields, fieldPath])
}

export interface OperatorInputStoryProps<T> {
  /** The operator input under test, e.g. `SearchFilterStringInput`. */
  input: ComponentType<OperatorInputComponentProps<T>>
  /** Field path in the fixture schema whose definition the input should receive. */
  fieldPath?: string
  /** Starting value, so a story can show the filled state as well as the empty one. */
  initialValue?: T | null
  /** Optional note rendered above the control, for stories that need one line of orientation. */
  hint?: string
}

/**
 * Render an operator input with live state and an emitted-value readout.
 */
export function OperatorInputStory<T>({
  input: Input,
  fieldPath,
  initialValue = null,
  hint,
}: OperatorInputStoryProps<T>) {
  const [value, setValue] = useState<T | null>(initialValue)
  const fieldDefinition = useFixtureFieldDefinition(fieldPath)

  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      {hint && (
        <Text muted size={1}>
          {hint}
        </Text>
      )}
      {fieldPath && !fieldDefinition && (
        <Card padding={2} radius={2} tone="caution">
          <Text size={1}>
            No field definition for <code>{fieldPath}</code>. The input still renders, but any
            behaviour that depends on the field (its type, its allowed reference types) will not.
          </Text>
        </Card>
      )}
      <Input fieldDefinition={fieldDefinition} onChange={setValue} value={value} />
      <Card padding={2} radius={2} tone="transparent" border>
        <Flex align="flex-start" gap={2}>
          <Box style={{flex: '0 0 auto'}}>
            <Text muted size={0} weight="medium">
              EMITS
            </Text>
          </Box>
          <Code size={0} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
            {value === null || value === undefined ? 'null' : JSON.stringify(value, null, 1)}
          </Code>
        </Flex>
      </Card>
    </Stack>
  )
}

/**
 * Convenience wrapper: providers + a padded canvas, for stories that render one input.
 * `fullscreen` matters to several inputs, which size themselves from `state.fullscreen`.
 */
export function FilterInputFrame({
  children,
  fullscreen = false,
}: {
  children: React.ReactNode
  fullscreen?: boolean
}) {
  return (
    <SearchHarness fullscreen={fullscreen}>
      <Box padding={4}>{children}</Box>
    </SearchHarness>
  )
}
