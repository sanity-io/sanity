import {type EditableReleaseDocument} from '@sanity/client'
import {defineField, type FieldDefinition} from '@sanity/types'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactElement, useCallback, useState} from 'react'
import {describe, expect, it, vi} from 'vitest'

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

function ControlledMetadataForm(props: {
  initial: ReleaseMetadataRecord
  onChange: (metadata: ReleaseMetadataRecord) => void
  onValidityChange?: (valid: boolean) => void
}) {
  const {initial, onChange, onValidityChange} = props
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
      metadata={metadata}
      onChange={handleChange}
      onValidityChange={onValidityChange}
    />
  )
}

function ControlledReleaseForm(props: {
  initial: EditableReleaseDocument
  onChange: (value: EditableReleaseDocument) => void
}) {
  const {initial, onChange} = props
  const [value, setValue] = useState(initial)
  const handleChange = useCallback(
    (next: EditableReleaseDocument) => {
      onChange(next)
      setValue(next)
    },
    [onChange],
  )
  return <ReleaseForm onChange={handleChange} value={value} />
}

async function renderWithFields(fields: FieldDefinition[], ui: ReactElement) {
  const wrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
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
