/* eslint-disable react/no-multi-comp */

import React from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import {
  EditorSelection,
  PortableTextEditor,
  PortableTextFeature,
  RenderBlockFunction
} from '@sanity/portable-text-editor'
export type BlockStyleItem = {
  active: boolean
  key: string
  preview: () => JSX.Element
  style: string
  title: string
}
type Props = {
  className: string
  editor: PortableTextEditor
  renderBlock: RenderBlockFunction
  selection: EditorSelection
}
const noStylePreview = (): JSX.Element => <div>No style</div>

export default function BlockStyleSelect(props: Props): JSX.Element {
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(props.editor)

  const renderStyle = (style, StyleComponent): JSX.Element => {
    return props.renderBlock(
      {
        _key: '1',
        _type: ptFeatures.types.block.name,
        children: [
          {
            _key: '2',
            _type: ptFeatures.types.span.name,
            text: style.title
          }
        ],
        style: style.value
      },
      ptFeatures.types.block,
      () => (StyleComponent ? <StyleComponent>{style.title}</StyleComponent> : <>{style.title}</>),
      {focused: false, selected: false, path: []},
      React.createRef()
    )
  }

  const getItemsAndValue = (): {
    items: BlockStyleItem[]
    value: BlockStyleItem[]
  } => {
    const {editor} = props
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const items = ptFeatures.styles.map((style: PortableTextFeature) => {
      const StyleComponent = style && style.blockEditor && style.blockEditor.render
      return {
        active: PortableTextEditor.hasBlockStyle(editor, style.value),
        key: `style-${style.value}`,
        preview: () => renderStyle(style, StyleComponent),
        style: style.value,
        title: ` ${style.title}`
      }
    })
    let value = items.filter(item => item.active)
    if (value.length === 0 && items.length > 1) {
      items.push({
        key: 'style-none',
        style: null,
        preview: noStylePreview,
        title: ' No style',
        active: true
      })
      value = items.slice(-1)
    }
    return {
      items: items,
      value: value
    }
  }

  const handleChange = (item: BlockStyleItem): void => {
    PortableTextEditor.toggleBlockStyle(props.editor, item.style)
  }

  const renderItem = (item: BlockStyleItem): JSX.Element => {
    return item.preview()
  }

  const {items, value} = getItemsAndValue()

  // If just one style, don't show
  if (!items || items.length < 2) {
    return null
  }
  const {className, editor} = props
  const focusBlock = PortableTextEditor.focusBlock(editor)
  const disabled = focusBlock ? ptFeatures.types.block.name !== focusBlock._type : false
  return (
    <label className={className}>
      <span style={{display: 'none'}}>Text</span>
      <StyleSelect
        disabled={disabled}
        items={items}
        onChange={handleChange}
        renderItem={renderItem}
        transparent
        value={value}
      />
    </label>
  )
}
