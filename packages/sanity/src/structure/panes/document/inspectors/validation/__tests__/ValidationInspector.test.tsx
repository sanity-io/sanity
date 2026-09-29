import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, type ValidationMarker} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type DocumentInspectorProps, type PatchEvent} from 'sanity'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {ValidationInspector} from '../ValidationInspector'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const {useDocumentPane} = vi.mocked(await import('../../../useDocumentPane'))

const schemaType = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'redirectPage',
      type: 'document',
      fields: [{name: 'destination', title: 'Destination', type: 'string'}],
    },
  ],
}).get('redirectPage') as ObjectSchemaType

const markerWithFixes: ValidationMarker = {
  level: 'error',
  message: 'Destination must not end with a trailing slash',
  path: ['destination'],
  suggestedFixes: [
    {type: 'set', title: 'Remove trailing slash', value: '/about'},
    {type: 'unset', title: 'Clear destination'},
  ],
}

const onChange = vi.fn<(event: PatchEvent) => void>()

async function renderInspector(options: {readOnly: boolean; validation: ValidationMarker[]}) {
  useDocumentPane.mockReturnValue({
    editState: null,
    formState: {readOnly: options.readOnly},
    onChange,
    onFocus: vi.fn(),
    onPathOpen: vi.fn(),
    schemaType,
    validation: options.validation,
    value: {_id: 'doc', _type: 'redirectPage', destination: '/about/'},
  } as unknown as ReturnType<typeof useDocumentPane>)

  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  const props = {onClose: vi.fn()} as unknown as DocumentInspectorProps
  render(<ValidationInspector {...props} />, {wrapper})
}

describe('ValidationInspector suggested fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('applies a set fix as a patch at the marker path', async () => {
    await renderInspector({readOnly: false, validation: [markerWithFixes]})

    await userEvent.click(await screen.findByRole('button', {name: 'Remove trailing slash'}))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]?.[0].patches).toMatchObject([
      {type: 'set', path: ['destination'], value: '/about'},
    ])
  })

  test('applies an unset fix as a patch at the marker path', async () => {
    await renderInspector({readOnly: false, validation: [markerWithFixes]})

    await userEvent.click(await screen.findByRole('button', {name: 'Clear destination'}))

    expect(onChange.mock.calls[0]?.[0].patches).toMatchObject([
      {type: 'unset', path: ['destination']},
    ])
  })

  test('offers no fixes when the document is read-only', async () => {
    await renderInspector({readOnly: true, validation: [markerWithFixes]})

    expect(await screen.findByText(markerWithFixes.message)).toBeInTheDocument()
    expect(screen.queryByTestId('validation-suggested-fix')).not.toBeInTheDocument()
  })

  test('renders markers without fixes as before', async () => {
    const {suggestedFixes: _, ...markerWithoutFixes} = markerWithFixes
    await renderInspector({readOnly: false, validation: [markerWithoutFixes]})

    expect(await screen.findByText(markerWithFixes.message)).toBeInTheDocument()
    expect(screen.queryByTestId('validation-suggested-fix')).not.toBeInTheDocument()
  })
})
