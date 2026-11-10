import {defineArrayMember, defineField, isObjectSchemaType} from '@sanity/types'
import {screen, within} from '@testing-library/react'
import {type ReactNode, useRef, useState} from 'react'
import {beforeEach, describe, expect, it} from 'vitest'

import {renderArrayOfObjectsInput} from '../../../../../../../test/form/renderArrayOfObjectsInput'
import {setupVirtualListEnv} from '../../../../../../../test/testUtils/setupVirtualListEnv'
import {ChangeIndicatorsTracker} from '../../../../../changeIndicators/tracker'
import {GetFormValueProvider} from '../../../../contexts/GetFormValue'
import {type FormDocumentValue} from '../../../../types/formDocumentValue'
import {type ArrayOfObjectsInputProps, type ObjectInputProps} from '../../../../types/inputProps'
import {type ObjectItemProps} from '../../../../types/itemProps'
import {ArrayOfObjectsInput} from '../ArrayOfObjectsInput'
import {VirtualizerScrollInstanceProvider} from '../List/VirtualizerScrollInstanceProvider'

/**
 * Stand-in for a nested array input (such as sanity-plugin-internationalized-array)
 * that renders its members with the `renderItem` it was given.
 */
function NestedArrayInput(props: ArrayOfObjectsInputProps) {
  const focusRef = useRef(null)
  const itemType = props.schemaType.of[0]
  if (!itemType || !isObjectSchemaType(itemType)) {
    return <div data-testid="nested-array">missing item type</div>
  }

  const path = [...props.path, {_key: 'en' as const}]
  const value = {_key: 'en', _type: itemType.name}
  const computeDiff = () => {
    throw new Error('not used by this test')
  }
  const inputProps: Omit<ObjectInputProps, 'renderDefault'> = {
    __unstable_computeDiff: computeDiff,
    changed: false,
    changedFromBaseVariant: false,
    displayInlineChanges: false,
    elementProps: {
      'aria-describedby': undefined,
      'id': 'nested-item',
      'onBlur': () => undefined,
      'onFocus': () => undefined,
      'ref': focusRef,
      'style': {},
    },
    focusPath: [],
    groups: [],
    hasBaseVariant: false,
    hasUpstreamVersion: false,
    id: 'nested-item',
    level: props.level + 1,
    members: [],
    onChange: () => undefined,
    onFieldClose: () => undefined,
    onFieldCollapse: () => undefined,
    onFieldExpand: () => undefined,
    onFieldGroupSelect: () => undefined,
    onFieldOpen: () => undefined,
    onFieldSetCollapse: () => undefined,
    onFieldSetExpand: () => undefined,
    onPathFocus: () => undefined,
    path,
    presence: [],
    renderField: () => null,
    renderInput: () => null,
    renderItem: () => null,
    renderPreview: () => <span data-testid="leaked-grid-preview">Untitled</span>,
    schemaType: itemType,
    validation: [],
    value,
  }
  const itemProps: Omit<ObjectItemProps, 'renderDefault'> = {
    __unstable_computeDiff: computeDiff,
    changed: false,
    changedFromBaseVariant: false,
    children: null,
    collapsed: false,
    collapsible: false,
    description: itemType.description,
    hasBaseVariant: false,
    hasUpstreamVersion: false,
    index: 0,
    inputId: 'nested-item',
    inputProps,
    level: props.level + 1,
    onBlur: () => undefined,
    onClose: () => undefined,
    onCollapse: () => undefined,
    onCopy: () => undefined,
    onExpand: () => undefined,
    onFocus: () => undefined,
    onInsert: () => undefined,
    onOpen: () => undefined,
    onRemove: () => undefined,
    open: false,
    parentSchemaType: props.schemaType,
    path,
    presence: [],
    schemaType: itemType,
    title: itemType.title,
    validation: [],
    value,
  }

  return <div data-testid="nested-array">{props.renderItem(itemProps)}</div>
}

function LanguageItem(props: ObjectItemProps) {
  return <span data-testid="language-item">{props.schemaType.title}</span>
}

const galleryImage = defineArrayMember({
  type: 'object',
  name: 'galleryImage',
  title: 'Image',
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'translation',
          title: 'Italiano',
          components: {item: LanguageItem},
          fields: [defineField({name: 'value', title: 'Value', type: 'string'})],
        }),
      ],
      components: {input: NestedArrayInput},
    }),
  ],
})

function galleryField(layout?: 'grid') {
  return defineField({
    name: 'images',
    title: 'Images',
    type: 'array',
    options: layout ? {layout} : undefined,
    of: [galleryImage],
  })
}

const documentValue: FormDocumentValue = {
  _id: 'doc',
  _type: 'test',
  images: [
    {
      _key: 'img',
      _type: 'galleryImage',
      alt: [{_key: 'en', _type: 'translation', value: 'Hello'}],
    },
  ],
}

function ScrollRoot(props: {children: ReactNode}) {
  const containerElement = useRef<HTMLDivElement>(null)
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={scrollElement}
      containerElement={containerElement}
    >
      <div ref={setScrollElement}>
        <div ref={containerElement}>{props.children}</div>
      </div>
    </VirtualizerScrollInstanceProvider>
  )
}

async function renderGallery(layout?: 'grid') {
  return renderArrayOfObjectsInput({
    fieldDefinition: galleryField(layout),
    props: {
      documentValue,
      openPath: ['images', {_key: 'img'}],
    },
    render: (inputProps) => (
      <GetFormValueProvider value={documentValue}>
        <ChangeIndicatorsTracker>
          <ScrollRoot>
            <ArrayOfObjectsInput {...inputProps} />
          </ScrollRoot>
        </ChangeIndicatorsTracker>
      </GetFormValueProvider>
    ),
  })
}

describe('array item renderers nested inside an array item', () => {
  setupVirtualListEnv()

  beforeEach(() => {
    // jsdom does not implement Element.scroll, which the open item calls when it scrolls into view.
    HTMLElement.prototype.scroll = () => undefined
  })

  it('renders a custom item component for an array nested inside a list item', async () => {
    await renderGallery()

    expect(screen.getByTestId('language-item')).toHaveTextContent('Italiano')
    expect(screen.queryByTestId('leaked-grid-preview')).not.toBeInTheDocument()
  })

  it('renders a custom item component for an array nested inside a grid item', async () => {
    await renderGallery('grid')

    const nested = within(screen.getByTestId('nested-array'))
    expect(nested.queryByTestId('leaked-grid-preview')).not.toBeInTheDocument()
    expect(nested.getByTestId('language-item')).toHaveTextContent('Italiano')
  })
})
