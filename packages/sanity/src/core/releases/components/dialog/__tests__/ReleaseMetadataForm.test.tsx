import {type EditableReleaseDocument} from '@sanity/client'
import {defineField, type FieldDefinition} from '@sanity/types'
import {act, render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactElement, useCallback, useState} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type InputProps} from '../../../../form/types/inputProps'
import {
  asReleaseMetadata,
  toReleaseMetadataRecord,
  type ReleaseMetadataRecord,
} from '../../../metadata/mergeReleaseMetadata'
import {ReleaseForm} from '../ReleaseForm'
import {ReleaseMetadataForm} from '../ReleaseMetadataForm'

const legalReviewField = defineField({
  name: 'legalReview',
  title: 'Legal review',
  type: 'string',
  initialValue: 'notReviewed',
  options: {
    list: [
      {title: 'Not reviewed', value: 'notReviewed'},
      {title: 'Reviewed', value: 'reviewed'},
    ],
  },
})

function CustomLegalInput(props: InputProps) {
  return <div data-testid="custom-legal-input">{String(props.value ?? '')}</div>
}

const customLegalReviewField = defineField({
  name: 'legalReview',
  title: 'Legal review',
  type: 'string',
  initialValue: 'notReviewed',
  components: {input: CustomLegalInput},
})

const signOffField = defineField({
  name: 'signOff',
  title: 'Sign-off',
  type: 'object',
  fields: [defineField({name: 'reviewer', title: 'Reviewer', type: 'string'})],
})

function ControlledMetadataForm(props: {
  initial: ReleaseMetadataRecord
  onChange: (metadata: ReleaseMetadataRecord) => void
  onValidityChange?: (valid: boolean) => void
  commitInitialValues?: boolean
}) {
  const {initial, onChange, onValidityChange, commitInitialValues} = props
  const [metadata, setMetadata] = useState(initial)
  const handleChange = useCallback(
    (next: EditableReleaseDocument['metadata']) => {
      const record = toReleaseMetadataRecord(next)
      onChange(record)
      setMetadata(record)
    },
    [onChange],
  )
  return (
    <ReleaseMetadataForm
      commitInitialValues={commitInitialValues}
      metadata={metadata}
      onChange={handleChange}
      onValidityChange={onValidityChange}
    />
  )
}

function ControlledReleaseForm(props: {
  initial: EditableReleaseDocument
  onChange: (value: EditableReleaseDocument) => void
  onValidityChange?: (valid: boolean) => void
}) {
  const {initial, onChange, onValidityChange} = props
  const [value, setValue] = useState(initial)
  const handleChange = useCallback(
    (next: EditableReleaseDocument) => {
      onChange(next)
      setValue(next)
    },
    [onChange],
  )
  return <ReleaseForm onChange={handleChange} onValidityChange={onValidityChange} value={value} />
}

async function renderWithFields(
  fields: FieldDefinition[],
  ui: ReactElement,
  variantsEnabled = true,
) {
  const wrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      beta: {variants: {enabled: variantsEnabled}},
      releases: {metadata: {fields}},
    },
  })
  return render(ui, {wrapper})
}

describe('ReleaseMetadataForm', () => {
  it('shows the initial value, writes the selected value, and keeps unknown metadata keys', async () => {
    const onChange = vi.fn()
    const metadata: ReleaseMetadataRecord = {
      releaseType: 'asap',
      reviewer: {team: 'legal'},
      tags: ['draft'],
    }

    await renderWithFields(
      [legalReviewField],
      <ControlledMetadataForm initial={metadata} onChange={onChange} />,
    )

    const field = await screen.findByTestId('field-legalReview')
    const select = within(field).getByRole('combobox')

    await waitFor(() => {
      expect(select).toHaveValue('0')
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        legalReview: 'notReviewed',
        releaseType: 'asap',
        reviewer: {team: 'legal'},
        tags: ['draft'],
      }),
    )

    await userEvent.selectOptions(select, '1')

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          legalReview: 'reviewed',
          releaseType: 'asap',
          reviewer: {team: 'legal'},
          tags: ['draft'],
        }),
      )
    })
  })

  it('pulls metadata fields back by the empty form gutter and keeps Sign-off children inside it', async () => {
    await renderWithFields(
      [legalReviewField, signOffField],
      <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={vi.fn()} />,
    )

    const legalReview = await screen.findByTestId('field-legalReview')
    const reviewer = await screen.findByTestId('field-signOff.reviewer')
    const align = legalReview.closest('[data-testid="release-metadata-form-align"]')

    expect(align).toBeInstanceOf(HTMLElement)
    expect(align).toHaveAttribute('data-gutter', 'true')
    expect(align).toContainElement(reviewer)

    const reviewerFieldset = reviewer.closest('fieldset')
    expect(reviewerFieldset).toBeInstanceOf(HTMLFieldSetElement)
    expect(align).toContainElement(reviewerFieldset)

    const cssText = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .map((rule) => rule.cssText)
      .join('\n')
      .replaceAll(/\s+/g, '')
    expect(cssText).toContain('margin-inline:calc((var(--formGutterSize)+var(--formGutterGap))*-1)')
    expect(cssText).toContain('margin-block-start:calc(var(--space-2)*-1)')
    expect(cssText).toContain('gap:calc(var(--space-5)-var(--space-2))')
  })

  it('defaults a missing key once on create, then leaves a cleared value omitted', async () => {
    const onChange = vi.fn()
    await renderWithFields(
      [legalReviewField],
      <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={onChange} />,
    )

    const select = within(await screen.findByTestId('field-legalReview')).getByRole('combobox')
    await waitFor(() => expect(select).toHaveValue('0'))
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({legalReview: 'notReviewed'}))
    })

    await userEvent.selectOptions(select, '-1')
    await waitFor(() => {
      const last = onChange.mock.calls.at(-1)?.[0]
      expect(last).not.toHaveProperty('legalReview')
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('legalReview')
    expect(select).toHaveValue('-1')
  })

  it('lets an edit clear a stored value without restoring initialValue', async () => {
    const onChange = vi.fn()
    await renderWithFields(
      [legalReviewField],
      <ControlledMetadataForm
        commitInitialValues={false}
        initial={{releaseType: 'asap', legalReview: 'reviewed'}}
        onChange={onChange}
      />,
    )

    const select = within(await screen.findByTestId('field-legalReview')).getByRole('combobox')
    await waitFor(() => expect(select).toHaveValue('1'))
    expect(onChange).not.toHaveBeenCalled()

    await userEvent.selectOptions(select, '-1')
    await waitFor(() => {
      const last = onChange.mock.calls.at(-1)?.[0]
      expect(last).not.toHaveProperty('legalReview')
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('legalReview')
    expect(select).toHaveValue('-1')
  })

  it('does not render a field that sets components.input', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onChange = vi.fn()

    await renderWithFields(
      [customLegalReviewField],
      <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={onChange} />,
    )

    expect(screen.queryByTestId('custom-legal-input')).toBeNull()
    expect(screen.queryByTestId('field-legalReview')).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('components.input'))
    warn.mockRestore()
  })

  it('stays invalid until the current check settles and ignores a stale result', async () => {
    const gates: Array<(result: true | string) => void> = []
    const onValidityChange = vi.fn()
    const reviewNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      validation: (rule) =>
        rule.custom(
          () =>
            new Promise((resolve) => {
              gates.push(resolve)
            }),
        ),
    })

    await renderWithFields(
      [reviewNote],
      <ControlledMetadataForm
        initial={{reviewNote: 'ok'}}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    )

    await waitFor(() => expect(gates.length).toBeGreaterThan(0))
    gates.at(-1)?.(true)
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledWith(true))

    const input = within(await screen.findByTestId('field-reviewNote')).getByRole('textbox')
    onValidityChange.mockClear()
    const afterFirst = gates.length
    await userEvent.type(input, 'x')
    await waitFor(() => expect(gates.length).toBeGreaterThan(afterFirst))
    const afterSecond = gates.length
    await userEvent.type(input, 'y')
    await waitFor(() => expect(gates.length).toBeGreaterThan(afterSecond))

    onValidityChange.mockClear()
    const latest = gates.length - 1
    for (let index = 0; index < latest; index++) {
      gates[index]?.('stale')
    }
    await act(async () => {
      await Promise.resolve()
    })
    expect(onValidityChange).not.toHaveBeenCalledWith(true)

    gates[latest]?.(true)
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledWith(true))
  })

  it('blocks validity until a required field is filled', async () => {
    const onChange = vi.fn()
    const onValidityChange = vi.fn()
    const requiredNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      validation: (rule) => rule.required(),
    })

    await renderWithFields(
      [requiredNote],
      <ControlledMetadataForm
        initial={{releaseType: 'asap', reviewer: {team: 'legal'}}}
        onChange={onChange}
        onValidityChange={onValidityChange}
      />,
    )

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenCalledWith(false)
    })

    const field = await screen.findByTestId('field-reviewNote')
    await userEvent.type(within(field).getByRole('textbox'), 'Cleared')

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenCalledWith(true)
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewNote: 'Cleared',
        reviewer: {team: 'legal'},
      }),
    )
  })
})

describe('ReleaseForm metadata fields', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not revalidate when the title changes, and blocks while the note is rechecked', async () => {
    const gates: Array<(result: true | string) => void> = []
    const onValidityChange = vi.fn()
    const reviewNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      validation: (rule) =>
        rule.custom(
          () =>
            new Promise((resolve) => {
              gates.push(resolve)
            }),
        ),
    })
    const value: EditableReleaseDocument = {
      _id: 'very-random',
      metadata: asReleaseMetadata({
        title: 'Spring',
        description: '',
        releaseType: 'asap',
        reviewNote: 'ok',
      }),
    }

    await renderWithFields(
      [reviewNote],
      <ControlledReleaseForm
        initial={value}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    )

    await waitFor(() => expect(gates.length).toBeGreaterThan(0))
    gates.at(-1)?.(true)
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledWith(true))

    onValidityChange.mockClear()
    const checksBeforeTitle = gates.length
    const title = screen.getByTestId('release-form-title')
    await userEvent.type(title, '!')
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(gates.length).toBe(checksBeforeTitle)
    expect(onValidityChange).not.toHaveBeenCalledWith(false)

    const note = within(screen.getByTestId('field-reviewNote')).getByRole('textbox')
    await userEvent.type(note, 'x')
    await waitFor(() => expect(gates.length).toBeGreaterThan(checksBeforeTitle))
    expect(onValidityChange).toHaveBeenCalledWith(false)
    expect(onValidityChange).not.toHaveBeenCalledWith(true)
  })

  it('does not render configured fields when variants are off', async () => {
    const onChange = vi.fn()
    const value: EditableReleaseDocument = {
      _id: 'very-random',
      metadata: asReleaseMetadata({
        title: 'Spring',
        description: '',
        releaseType: 'asap',
      }),
    }

    await renderWithFields(
      [legalReviewField],
      <ControlledReleaseForm initial={value} onChange={onChange} />,
      false,
    )

    expect(screen.queryByTestId('field-legalReview')).toBeNull()
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({legalReview: 'notReviewed'}),
      }),
    )
  })

  it('includes the configured field on the release passed to onChange', async () => {
    const onChange = vi.fn()
    const value: EditableReleaseDocument = {
      _id: 'very-random',
      metadata: asReleaseMetadata({
        title: 'Spring',
        description: '',
        releaseType: 'asap',
        reviewer: {team: 'legal'},
      }),
    }

    await renderWithFields(
      [legalReviewField],
      <ControlledReleaseForm initial={value} onChange={onChange} />,
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'very-random',
          metadata: expect.objectContaining({
            title: 'Spring',
            releaseType: 'asap',
            legalReview: 'notReviewed',
            reviewer: {team: 'legal'},
          }),
        }),
      )
    })

    const field = await screen.findByTestId('field-legalReview')
    await userEvent.selectOptions(within(field).getByRole('combobox'), '1')

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            title: 'Spring',
            legalReview: 'reviewed',
            reviewer: {team: 'legal'},
          }),
        }),
      )
    })
  })
})
