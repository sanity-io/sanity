import {Text, TextInput} from '@sanity/ui'
import {type ComponentProps} from 'react'
import {VStack} from 'ui5'

import {normalizeReproPath} from './reproPath'

/**
 * The "where in the test studio does it reproduce" input. Whatever was typed
 * or pasted collapses to the normalized path on blur, so a pasted test-studio
 * URL visibly becomes just its path before it is saved.
 */
export function ReproPathInput(
  props: {value: string; onChange: (value: string) => void} & Omit<
    ComponentProps<typeof TextInput>,
    'value' | 'onChange' | 'onBlur'
  >,
) {
  const {value, onChange, ...rest} = props
  return (
    <TextInput
      fontSize={1}
      placeholder="/test/structure/author;abc"
      // The visible label is a sibling in both call sites, not a <label>
      aria-label="Test studio path"
      {...rest}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      onBlur={() => {
        const normalized = normalizeReproPath(value) ?? ''
        if (normalized !== value) onChange(normalized)
      }}
    />
  )
}

/** The input with its label and hint, for dialogs. */
export function ReproPathField(props: {
  value: string
  onChange: (value: string) => void
  /** What the path is appended to, lowercase, e.g. "every preview build the bisect proposes". */
  appliesTo: string
}) {
  const {value, onChange, appliesTo} = props
  return (
    <VStack gap={3}>
      <Text size={1} weight="medium">
        Test studio path{' '}
        <Text as="span" size={1} muted>
          (optional)
        </Text>
      </Text>
      <ReproPathInput value={value} onChange={onChange} />
      <Text size={0} muted>
        Where the issue reproduces — {appliesTo} opens there. Paste a test-studio URL and only its
        path is kept.
      </Text>
    </VStack>
  )
}
