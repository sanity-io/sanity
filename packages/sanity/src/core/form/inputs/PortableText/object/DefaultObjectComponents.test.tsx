import {render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type BlockProps} from '../../../types'
import {DefaultBlockObjectComponent} from './BlockObject'
import {DefaultInlineObjectComponent} from './InlineObject'

const createBlockProps = (renderPreview: BlockProps['renderPreview']): BlockProps =>
  ({
    __unstable_floatingBoundary: null,
    __unstable_referenceBoundary: null,
    __unstable_referenceElement: null,
    changed: true,
    children: null,
    focused: false,
    markers: [],
    onClose: vi.fn(),
    onOpen: vi.fn(),
    onPathFocus: vi.fn(),
    onRemove: vi.fn(),
    open: false,
    parentSchemaType: {name: 'block', jsonType: 'object', fields: []},
    path: [{_key: 'block-key'}],
    presence: [],
    readOnly: false,
    renderDefault: () => <></>,
    renderField: vi.fn(),
    renderInput: vi.fn(),
    renderItem: vi.fn(),
    renderPreview,
    schemaType: {name: 'testObject', jsonType: 'object', fields: []},
    selected: false,
    validation: [],
    value: {_type: 'testObject', _key: 'block-key'},
  }) as unknown as BlockProps

describe('PTE default object components', () => {
  it('forwards `changed` to renderPreview for block objects', async () => {
    const renderPreview = vi.fn(() => <div data-testid="preview" />)
    const wrapper = await createTestProvider()

    render(<DefaultBlockObjectComponent {...createBlockProps(renderPreview)} />, {wrapper})

    expect(renderPreview).toHaveBeenCalledWith(expect.objectContaining({changed: true}))
  })

  it('forwards `changed` to renderPreview for inline objects', async () => {
    const renderPreview = vi.fn(() => <span data-testid="preview" />)
    const wrapper = await createTestProvider()

    render(<DefaultInlineObjectComponent {...createBlockProps(renderPreview)} />, {wrapper})

    expect(renderPreview).toHaveBeenCalledWith(expect.objectContaining({changed: true}))
  })
})
