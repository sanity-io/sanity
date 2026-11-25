import {diffInput, wrap} from '@sanity/diff'
import {waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {renderStringInput} from '../../../../test/form/renderStringInput'
import {type ProvenanceDiffAnnotation} from '../store/types/diff'
import {type ComputeDiff} from '../store/types/nodes'
import {TextInput} from './TextInput'

const PT_INPUT = '[data-testid="string-input-portable-text"]'
const REFERENCE = 'First line\nSecond line'
const VALUE = 'First line\nSecond line, changed'
const FIELD = {type: 'text', name: 'note', title: 'Note'} as const

const annotation: ProvenanceDiffAnnotation = {provenance: {}}
const computeDiff: ComputeDiff<ProvenanceDiffAnnotation> = (value) =>
  diffInput(wrap(REFERENCE, annotation), wrap(value ?? '', annotation))

describe('TextInput', () => {
  it('shows a read-only value with inline changes as text that keeps its line breaks', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => (
        <TextInput
          {...inputProps}
          value={VALUE}
          readOnly
          displayInlineChanges
          __unstable_computeDiff={computeDiff}
        />
      ),
      fieldDefinition: FIELD,
    })

    const input = result.container.querySelector(PT_INPUT)
    expect(input).not.toBeNull()
    expect(input?.getAttribute('data-multiline')).toBe('true')
    expect(result.container.querySelector('textarea')).toBeNull()
    // One span holds the whole value, line break included
    await waitFor(() => expect(input?.textContent).toContain('Second line, changed'))
    expect(input?.textContent).toContain('First line\nSecond line')
  })

  it('keeps the text area while the field can be edited, inline changes or not', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => (
        <TextInput
          {...inputProps}
          value={VALUE}
          displayInlineChanges
          __unstable_computeDiff={computeDiff}
        />
      ),
      fieldDefinition: FIELD,
    })

    expect(result.container.querySelector(PT_INPUT)).toBeNull()
    expect(result.container.querySelector('textarea')).not.toBeNull()
  })

  it('keeps the text area when inline changes are off', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => <TextInput {...inputProps} value={VALUE} readOnly />,
      fieldDefinition: FIELD,
    })

    expect(result.container.querySelector(PT_INPUT)).toBeNull()
    expect(result.container.querySelector('textarea')).not.toBeNull()
  })
})
