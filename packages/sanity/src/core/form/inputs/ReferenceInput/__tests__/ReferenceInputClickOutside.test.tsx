import {type SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {
  type ObjectSchemaType,
  type Path,
  type Reference,
  type ReferenceSchemaType,
} from '@sanity/types'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useRef, useState} from 'react'
import {of} from 'rxjs'
import {ArrayItemRootElementContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useSchema} from '../../../../hooks/useSchema'
import {FormValueProvider} from '../../../contexts/FormValue'
import {createPatchChannel} from '../../../patch/PatchChannel'
import {FormProvider} from '../../../studio/FormProvider'
import {type FormDocumentValue} from '../../../types/formDocumentValue'
import {ReferenceInput} from '../ReferenceInput'
import {ReferenceItemRefProvider} from '../ReferenceItemRefProvider'
import {type ReferenceInputProps, type ReferenceSearchHit} from '../types'

vi.mock('../../../studio/inputs/client-adapters/reference', () => ({
  getReferenceInfo: () =>
    of({
      id: 'actor-1',
      type: 'actor',
      isPublished: true,
      availability: {available: true, reason: 'READABLE'},
      preview: {
        snapshot: {title: 'Actor One'},
        original: {title: 'Actor One'},
      },
    }),
}))

const EMPTY_SEARCH = () => of([])
const SEARCH_HITS: ReferenceSearchHit[] = [
  {id: 'actor-1', type: 'actor', published: true},
  {id: 'actor-2', type: 'actor', published: true},
]
const SEARCH_WITH_HITS = () => of(SEARCH_HITS)

const POPULATED_VALUE: Reference = {_type: 'reference', _ref: 'actor-1'}

const schema = Schema.compile({
  name: 'default',
  types: [
    {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
    {name: 'actorReference', type: 'reference', to: [{type: 'actor'}]},
  ],
})

const documentValue = {_id: 'test', _type: 'test'} as unknown as FormDocumentValue

/**
 * Mimics the array item wrapper (`Item` in `../arrays/common/list.tsx`), which
 * provides its root element so that reference inputs can ignore clicks within
 * the item — e.g. on UI rendered by custom item/input components.
 */
function ArrayItemRoot(props: {children: ReactNode}) {
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  return (
    <ArrayItemRootElementContext.Provider value={rootElementRef}>
      <div data-testid="array-item-root" ref={rootElementRef}>
        {props.children}
      </div>
    </ArrayItemRootElementContext.Provider>
  )
}

/**
 * Supplies the same item-chrome refs ReferenceItem provides in arrays. Menu
 * controls sit outside `containerRef` so blur assertions exercise those
 * dedicated guards, not just the container contains() check.
 */
function ReferenceItemChrome(props: {children: ReactNode}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <ReferenceItemRefProvider
      menuRef={menuRef}
      menuButtonRef={menuButtonRef}
      containerRef={containerRef}
    >
      <div data-testid="reference-item-container" ref={containerRef}>
        {props.children}
      </div>
      <button data-testid="reference-menu-button" ref={menuButtonRef} type="button">
        Show more
      </button>
      <div data-testid="reference-menu" ref={menuRef} tabIndex={-1}>
        Menu
      </div>
    </ReferenceItemRefProvider>
  )
}

function FormHarness(props: {children: ReactNode}) {
  const workspaceSchema = useSchema()
  const documentType = workspaceSchema.get('test') as ObjectSchemaType
  const [patchChannel] = useState(() => createPatchChannel())

  return (
    <FormProvider
      __internal_patchChannel={patchChannel}
      changesOpen={false}
      collapsedFieldSets={undefined}
      collapsedPaths={undefined}
      focusPath={[]}
      focused={undefined}
      groups={[]}
      id="test"
      onChange={noop}
      onFieldGroupSelect={noop}
      onPathBlur={noop}
      onPathFocus={noop}
      onPathOpen={noop}
      onSetFieldSetCollapsed={noop}
      onSetPathCollapsed={noop}
      presence={[]}
      readOnly={false}
      schemaType={documentType}
      validation={[]}
    >
      {props.children}
    </FormProvider>
  )
}

interface RenderReferenceInputOptions {
  createOptions?: ReferenceInputProps['createOptions']
  focusPath?: Path
  focused?: boolean
  onSearch?: ReferenceInputProps['onSearch']
  value?: Reference
  withItemRefs?: boolean
}

async function renderReferenceInput(options: RenderReferenceInputOptions = {}) {
  const {
    createOptions = [],
    focusPath = ['_ref'],
    focused = true,
    onSearch = EMPTY_SEARCH,
    value,
    withItemRefs = false,
  } = options

  const client = createMockSanityClient() as unknown as SanityClient
  const TestProvider = await createTestProvider({
    client,
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: [
          {
            name: 'test',
            type: 'document',
            fields: [{name: 'actorRef', type: 'reference', to: [{type: 'actor'}]}],
          },
          {name: 'actor', type: 'document', fields: [{name: 'name', type: 'string'}]},
        ],
      },
    },
  })

  const onChange = vi.fn()
  const onPathFocus = vi.fn()
  const onBlur = vi.fn()
  const elementProps = {
    id: 'ref-input',
    onBlur,
    onFocus: vi.fn(),
    ref: {current: null},
  } as unknown as ReferenceInputProps['elementProps']

  const props = {
    changed: false,
    createOptions,
    editReferenceLinkComponent: () => null,
    elementProps,
    focusPath,
    focused,
    getReferenceInfo: () => of(null as never),
    id: 'ref-input',
    level: 1,
    liveEdit: false,
    onChange,
    onEditReference: vi.fn(),
    onPathFocus,
    onSearch,
    path: ['sections', {_key: 'item-0'}],
    presence: [],
    renderPreview: () => null,
    schemaType: schema.get('actorReference') as ReferenceSchemaType,
    validation: [],
    value,
  } as unknown as ReferenceInputProps

  const input = (
    <>
      <ReferenceInput {...props} />
      <button data-testid="custom-create-button" type="button">
        Create new
      </button>
    </>
  )

  render(
    <TestProvider>
      <FormHarness>
        <FormValueProvider value={documentValue}>
          <ArrayItemRoot>
            {withItemRefs ? <ReferenceItemChrome>{input}</ReferenceItemChrome> : input}
          </ArrayItemRoot>
        </FormValueProvider>
        <button data-testid="outside-button" type="button">
          Outside
        </button>
      </FormHarness>
    </TestProvider>,
  )

  return {onBlur, onChange, onPathFocus}
}

async function getEditableCombobox() {
  const input = screen.getByRole('combobox')
  await waitFor(() => {
    expect(input).not.toHaveAttribute('readonly')
    expect(input).not.toBeDisabled()
  })
  return input
}

async function moveFocus(from: HTMLElement, to: HTMLElement) {
  await act(async () => {
    from.focus()
    to.focus()
    // Autocomplete defers its root blur and only then calls the input onBlur.
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('ReferenceInput click outside handling', () => {
  it('does not clear the empty reference when the mousedown happens on custom UI within the same array item', async () => {
    const {onChange} = await renderReferenceInput()

    // oxlint-disable-next-line testing-library/prefer-user-event -- the regression happens on the mousedown phase, before any click
    fireEvent.mouseDown(screen.getByTestId('custom-create-button'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the empty reference when the mousedown happens outside the array item', async () => {
    const {onChange} = await renderReferenceInput()

    // oxlint-disable-next-line testing-library/prefer-user-event -- the clear is triggered by the mousedown phase, before any click
    fireEvent.mouseDown(screen.getByTestId('outside-button'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'unset', path: []}))
  })

  it('does not steal focus from another field when a populated reference is not being edited', async () => {
    const {onChange, onPathFocus} = await renderReferenceInput({
      focusPath: [],
      focused: false,
      value: POPULATED_VALUE,
    })

    // oxlint-disable-next-line testing-library/prefer-user-event -- click-outside is handled on mousedown
    fireEvent.mouseDown(screen.getByTestId('outside-button'))

    expect(onPathFocus).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('exits replace mode without unsetting a populated reference on an outside mousedown', async () => {
    const {onChange, onPathFocus} = await renderReferenceInput({
      value: POPULATED_VALUE,
    })

    // oxlint-disable-next-line testing-library/prefer-user-event -- click-outside is handled on mousedown
    fireEvent.mouseDown(screen.getByTestId('outside-button'))

    expect(onPathFocus).toHaveBeenCalledTimes(1)
    expect(onPathFocus).toHaveBeenCalledWith([])
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('ReferenceInput blur handling', () => {
  it('does not call onBlur when focus moves to the reference context-menu button', async () => {
    const {onBlur} = await renderReferenceInput({withItemRefs: true})
    const input = await getEditableCombobox()

    await moveFocus(input, screen.getByTestId('reference-menu-button'))

    expect(onBlur).not.toHaveBeenCalled()
  })

  it('does not call onBlur when focus moves to the reference context menu', async () => {
    const {onBlur} = await renderReferenceInput({withItemRefs: true})
    const input = await getEditableCombobox()

    await moveFocus(input, screen.getByTestId('reference-menu'))

    expect(onBlur).not.toHaveBeenCalled()
  })

  it('does not call onBlur when focus moves into the autocomplete portal', async () => {
    const {onBlur} = await renderReferenceInput({
      onSearch: SEARCH_WITH_HITS,
      value: POPULATED_VALUE,
    })
    const input = await getEditableCombobox()
    const popover = await screen.findByTestId('autocomplete-popover')

    await moveFocus(input, popover)

    expect(onBlur).not.toHaveBeenCalled()
  })

  it('does not call onBlur when the input blurs after a pointerdown on the autocomplete portal', async () => {
    const {onBlur} = await renderReferenceInput({
      onSearch: SEARCH_WITH_HITS,
      value: POPULATED_VALUE,
    })
    const input = await getEditableCombobox()
    const popover = await screen.findByTestId('autocomplete-popover')

    input.focus()
    // oxlint-disable-next-line testing-library/prefer-user-event -- Safari closes on pointerdown+blur, before click
    fireEvent.pointerDown(popover)
    fireEvent.focusOut(input, {relatedTarget: null})
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(onBlur).not.toHaveBeenCalled()
  })

  it('does not call onBlur when focus moves to custom UI within the same array item', async () => {
    const {onBlur} = await renderReferenceInput()
    const input = await getEditableCombobox()

    await moveFocus(input, screen.getByTestId('custom-create-button'))

    expect(onBlur).not.toHaveBeenCalled()
  })

  it('delegates to onBlur when focus moves outside the reference chrome', async () => {
    const {onBlur} = await renderReferenceInput({withItemRefs: true})
    const input = await getEditableCombobox()

    await moveFocus(input, screen.getByTestId('outside-button'))

    expect(onBlur).toHaveBeenCalled()
  })
})

describe('ReferenceInput autocomplete clear', () => {
  it('unsets only _ref and leaves edit mode, keeping the array item in place', async () => {
    const {onChange, onPathFocus} = await renderReferenceInput({
      onSearch: SEARCH_WITH_HITS,
      value: POPULATED_VALUE,
    })
    const user = userEvent.setup()
    const input = await getEditableCombobox()

    await user.click(input)
    await user.keyboard('{Control>}a{/Control}{Backspace}act')
    await waitFor(() => {
      expect(input).toHaveValue('act')
    })

    const clearButton = screen.getByRole('button', {name: /clear/i})
    onPathFocus.mockClear()
    await user.click(clearButton)

    // Unsetting the whole object would remove the item from an array of
    // references; only the `_ref` path is unset.
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'unset', path: ['_ref']}))
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({type: 'unset', path: []}))
    expect(onPathFocus).toHaveBeenCalledWith([])
  })
})
