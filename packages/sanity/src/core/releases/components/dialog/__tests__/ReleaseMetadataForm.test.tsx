import {type EditableReleaseDocument} from '@sanity/client'
import {
  defineField,
  defineType,
  type FieldDefinition,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {act, render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactElement, type ReactNode, useCallback, useState} from 'react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  type EditReferenceLinkComponentProps,
  ReferenceInputOptionsProvider,
} from '../../../../form/studio/contexts/ReferenceInputOptions'
import {type InputProps} from '../../../../form/types/inputProps'
import {
  asReleaseMetadata,
  toReleaseMetadataRecord,
  type ReleaseMetadataRecord,
} from '../../../metadata/mergeReleaseMetadata'
import {ReleaseForm} from '../ReleaseForm'
import {ReleaseMetadataForm} from '../ReleaseMetadataForm'

interface FetchOptions {
  tag?: string
  perspective?: string[]
}

const authorType = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [{name: 'name', title: 'Name', type: 'string'}],
})

const getReferenceInfo = vi.hoisted(() => vi.fn())

vi.mock('../../../../form/studio/inputs/client-adapters/reference', () => ({getReferenceInfo}))

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
  client = createMockSanityClientAsClient(),
  schemaTypes: SchemaTypeDefinition[] = [],
) {
  const wrapper = await createTestProvider({
    client,
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {name: 'default', types: [authorType, ...schemaTypes]},
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

  it('omits the gutter on metadata rows and keeps it on Sign-off children', async () => {
    await renderWithFields(
      [legalReviewField, signOffField],
      <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={vi.fn()} />,
    )

    const legalReview = await screen.findByTestId('field-legalReview')
    const signOff = await screen.findByTestId('field-signOff')
    const reviewer = await screen.findByTestId('field-signOff.reviewer')
    const align = legalReview.closest('[data-testid="release-metadata-form-align"]')

    expect(align).toBeInstanceOf(HTMLElement)
    expect(align).toContainElement(reviewer)
    expect(legalReview.querySelector('[data-ui="FormRow"]')).not.toHaveAttribute('data-gutter')
    expect(signOff.closest('[data-ui="FormRow"]')).not.toHaveAttribute('data-gutter')
    expect(reviewer.querySelector('[data-ui="FormRow"]')).toHaveAttribute('data-gutter', 'true')

    const reviewerFieldset = reviewer.closest('fieldset')
    expect(reviewerFieldset).toBeInstanceOf(HTMLFieldSetElement)
    expect(align).toContainElement(reviewerFieldset)

    const cssText = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .map((rule) => rule.cssText)
      .join('\n')
      .replaceAll(/\s+/g, '')
    expect(cssText).not.toContain(
      'margin-inline:calc((var(--formGutterSize)+var(--formGutterGap))*-1)',
    )
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

  it('enables save when a rule reads a sibling on the metadata document', async () => {
    const onValidityChange = vi.fn()
    const reviewNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      validation: (rule) =>
        rule.custom((_value, context) => {
          return context.document?.legalReview === 'reviewed' ? true : 'Needs legal review'
        }),
    })

    await renderWithFields(
      [legalReviewField, reviewNote],
      <ControlledMetadataForm
        initial={{releaseType: 'asap', legalReview: 'reviewed', reviewNote: 'ok'}}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    )

    await waitFor(() => expect(onValidityChange).toHaveBeenCalledWith(true))
    expect(screen.queryByText('Release metadata validation failed')).toBeNull()
  })

  it('settles a rejected validation check as invalid', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onValidityChange = vi.fn()
    const reviewNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      validation: (rule) => rule.custom(() => Promise.reject(undefined)),
    })

    await renderWithFields(
      [reviewNote],
      <ControlledMetadataForm
        initial={{reviewNote: 'ok'}}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    )

    expect(await screen.findByText('Release metadata validation failed')).toBeInTheDocument()
    expect(
      within(screen.getByTestId('field-reviewNote')).getAllByTestId('input-validation-icon-error')
        .length,
    ).toBeGreaterThan(0)
    expect(onValidityChange).toHaveBeenCalledWith(false)
    expect(onValidityChange).not.toHaveBeenCalledWith(true)
    expect(error).toHaveBeenCalledWith('Release metadata validation failed', expect.anything())

    const input = within(screen.getByTestId('field-reviewNote')).getByRole('textbox')
    await userEvent.type(input, 'x')
    expect(input).toHaveValue('okx')
    expect(onValidityChange).not.toHaveBeenCalledWith(true)
    error.mockRestore()
  })

  it('skips a rejected initial value and leaves the field editable', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const initialValue = vi.fn(() => Promise.reject(new Error('bad initial value')))
    const onChange = vi.fn()
    const reviewNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      initialValue,
    })

    await renderWithFields(
      [reviewNote],
      <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={onChange} />,
    )

    const input = within(await screen.findByTestId('field-reviewNote')).getByRole('textbox')
    await waitFor(() => expect(initialValue.mock.calls.length).toBeGreaterThan(0))
    const callsBeforeEdit = initialValue.mock.calls.length
    expect(onChange).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith('Release metadata initial value failed', expect.any(Error))

    await userEvent.type(input, 'Ok')
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({reviewNote: 'Ok'}))
    })
    expect(initialValue).toHaveBeenCalledTimes(callsBeforeEdit)
    error.mockRestore()
  })

  it('skips a throwing initial value without retrying it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const initialValue = vi.fn((): string => {
      throw new Error('bad initial value')
    })
    const onChange = vi.fn()
    const reviewNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      initialValue,
    })

    await renderWithFields(
      [reviewNote],
      <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={onChange} />,
    )

    const input = within(await screen.findByTestId('field-reviewNote')).getByRole('textbox')
    await waitFor(() => expect(error).toHaveBeenCalled())
    const callsBeforeEdit = initialValue.mock.calls.length
    expect(callsBeforeEdit).toBeGreaterThan(0)
    expect(onChange).not.toHaveBeenCalled()

    await userEvent.type(input, 'Ok')
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({reviewNote: 'Ok'}))
    })
    expect(initialValue).toHaveBeenCalledTimes(callsBeforeEdit)
    error.mockRestore()
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

const relatedAuthorField = defineField({
  name: 'relatedAuthor',
  title: 'Related author',
  type: 'reference',
  to: [{type: 'author'}],
  validation: (rule) => rule.required(),
})

const storedAuthorReference = {_type: 'reference', _ref: 'author-1', _weak: true}

function LeakedEditReferenceLink(props: EditReferenceLinkComponentProps) {
  return <a data-testid="leaked-edit-link">{props.children}</a>
}

function OuterDocumentPaneOptions(props: {children: ReactNode; onEditReference: () => void}) {
  return (
    <ReferenceInputOptionsProvider
      EditReferenceLinkComponent={LeakedEditReferenceLink}
      initialValueTemplateItems={[
        {
          id: 'author',
          title: 'Author',
          type: 'initialValueTemplateItem',
          schemaType: 'author',
          templateId: 'author',
          granted: true,
          reason: 'Granted',
          resolvedInitialValue: {},
          template: {id: 'author', schemaType: 'author', title: 'Author', value: {}},
        },
      ]}
      onEditReference={props.onEditReference}
    >
      {props.children}
    </ReferenceInputOptionsProvider>
  )
}

describe('ReleaseMetadataForm reference fields', () => {
  beforeEach(() => {
    getReferenceInfo.mockReset()
    getReferenceInfo.mockImplementation(() =>
      of({
        id: 'author-1',
        type: 'author',
        isPublished: true,
        availability: {available: true, reason: 'READABLE'},
        preview: {snapshot: {title: 'Ada'}, original: {title: 'Ada'}},
      }),
    )
  })

  it('keeps the selected reference visible as a link that opens the document in a new tab', async () => {
    const onValidityChange = vi.fn()
    await renderWithFields(
      [relatedAuthorField],
      <ControlledMetadataForm
        initial={{releaseType: 'asap', relatedAuthor: storedAuthorReference}}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    )

    const link = await screen.findByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('href', expect.stringContaining('author-1'))
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledWith(true))
  })

  it('searches and previews in the published perspective', async () => {
    await renderWithFields(
      [relatedAuthorField],
      <ControlledMetadataForm
        initial={{releaseType: 'asap', relatedAuthor: storedAuthorReference}}
        onChange={vi.fn()}
      />,
    )

    await waitFor(() => expect(getReferenceInfo).toHaveBeenCalled())
    expect(getReferenceInfo.mock.calls.every((call) => call[3]?.join() === 'published')).toBe(true)
  })

  it('ignores the reference options of an outer document pane', async () => {
    const onEditReference = vi.fn()
    await renderWithFields(
      [relatedAuthorField],
      <OuterDocumentPaneOptions onEditReference={onEditReference}>
        <ControlledMetadataForm
          initial={{releaseType: 'asap', relatedAuthor: storedAuthorReference}}
          onChange={vi.fn()}
        />
        <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={vi.fn()} />
      </OuterDocumentPaneOptions>,
    )

    await screen.findByRole('link')
    expect(screen.getAllByTestId('autocomplete')).toHaveLength(1)
    expect(screen.queryByTestId('leaked-edit-link')).toBeNull()
    expect(screen.queryByTestId(/^create-new-document-select/)).toBeNull()
    expect(onEditReference).not.toHaveBeenCalled()
  })

  it('stays invalid while a required reference is empty', async () => {
    const onValidityChange = vi.fn()
    await renderWithFields(
      [relatedAuthorField],
      <ControlledMetadataForm
        initial={{releaseType: 'asap'}}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    )

    await screen.findByTestId('autocomplete')
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledWith(false))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(onValidityChange).not.toHaveBeenCalledWith(true)
  })

  describe('stores references weak however they were produced', () => {
    const strongInitial = {_type: 'reference', _ref: 'author-1'}
    const storedWeak = {_type: 'reference', _ref: 'author-1', _weak: true}

    async function seeded(field: FieldDefinition, schemaTypes: SchemaTypeDefinition[] = []) {
      const onChange = vi.fn()
      await renderWithFields(
        [field],
        <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={onChange} />,
        true,
        createMockSanityClientAsClient(),
        schemaTypes,
      )
      return onChange
    }

    it('seeds an inline reference initialValue weak', async () => {
      const onChange = await seeded(
        defineField({
          name: 'owner',
          type: 'reference',
          to: [{type: 'author'}],
          initialValue: {...strongInitial, _strengthenOnPublish: {type: 'author'}},
        }),
      )

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({owner: storedWeak})),
      )
    })

    it('seeds the initialValue of a named reference type weak', async () => {
      const onChange = await seeded(defineField({name: 'owner', type: 'seededAuthorRef'}), [
        defineType({
          name: 'seededAuthorRef',
          type: 'reference',
          weak: true,
          to: [{type: 'author'}],
          initialValue: strongInitial,
        }),
      ])

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({owner: {...storedWeak, _type: 'seededAuthorRef'}}),
        ),
      )
    })

    it('seeds a reference nested in an object initialValue weak', async () => {
      const onChange = await seeded(
        defineField({
          name: 'signOff',
          type: 'object',
          fields: [defineField({name: 'owner', type: 'reference', to: [{type: 'author'}]})],
          initialValue: {owner: strongInitial},
        }),
      )

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({signOff: {owner: storedWeak}}),
        ),
      )
    })

    it('weakens a restored strong reference when another field is edited', async () => {
      const onChange = vi.fn()
      await renderWithFields(
        [relatedAuthorField, defineField({name: 'note', type: 'string'})],
        <ControlledMetadataForm
          initial={{releaseType: 'asap', relatedAuthor: strongInitial}}
          onChange={onChange}
        />,
      )

      await userEvent.type(
        within(await screen.findByTestId('field-note')).getByRole('textbox'),
        'x',
      )

      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({relatedAuthor: storedWeak, note: 'x'}),
        ),
      )
    })
  })

  describe('against a dataset with a draft-only document', () => {
    const dataset = [
      {_id: 'author-1', _type: 'author', _rev: 'rev-1', name: 'Ada'},
      {_id: 'drafts.author-2', _type: 'author', _rev: 'rev-2', name: 'Bea'},
    ]

    function resolveInPerspective(id: string, perspective: string[] | undefined) {
      const candidates = perspective?.includes('drafts') ? [`drafts.${id}`, id] : [id]
      const found = candidates
        .map((candidate) => dataset.find((doc) => doc._id === candidate))
        .find((doc) => doc !== undefined)
      return found ? {found, _id: id} : undefined
    }

    function createDatasetClient() {
      const client = createMockSanityClientAsClient()
      client.observable.fetch = ((
        query: string,
        params: {__query?: string},
        options?: FetchOptions,
      ) => {
        if (options?.tag === 'search.reference') {
          const prefix = (params.__query ?? '').replace('*', '').toLowerCase()
          const ids = dataset.map((doc) => doc._id.replace('drafts.', ''))
          const hits = ids
            .map((id) => resolveInPerspective(id, options.perspective))
            .filter((resolved) => resolved?.found.name.toLowerCase().startsWith(prefix))
          return of(
            hits.map((resolved) => ({
              _id: resolved?._id,
              _type: 'author',
              _originalId: resolved?.found._id,
            })),
          )
        }
        const requestedId = /_id in \["([^"]+)"\]/.exec(query)?.[1] ?? ''
        const resolved = resolveInPerspective(requestedId, options?.perspective)
        return of([resolved ? [{...resolved.found, _id: requestedId}] : []])
      }) as typeof client.observable.fetch
      return client
    }

    it('stores a picked reference as a weak reference without strengthen-on-publish', async () => {
      const onChange = vi.fn()
      await renderWithFields(
        [relatedAuthorField],
        <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={onChange} />,
        true,
        createDatasetClient(),
      )

      await userEvent.type(await screen.findByTestId('autocomplete'), 'Ada')
      await userEvent.click(await screen.findByText('Ada'))

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            relatedAuthor: {_type: 'reference', _ref: 'author-1', _weak: true},
          }),
        )
      })
    })

    it('does not offer a document that has no published version', async () => {
      await renderWithFields(
        [relatedAuthorField],
        <ControlledMetadataForm initial={{releaseType: 'asap'}} onChange={vi.fn()} />,
        true,
        createDatasetClient(),
      )

      await userEvent.type(await screen.findByTestId('autocomplete'), 'Bea')
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
      })

      expect(screen.getByText(/No results for/)).toBeInTheDocument()
      expect(screen.queryByText('Bea')).toBeNull()
    })
  })
})
