/* eslint-disable react/no-multi-comp */

import React from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import {
  EditorSelection,
  PortableTextEditor,
  RenderBlockFunction
} from '@sanity/portable-text-editor'
import {BlockStyleItem} from './types'

type Props = {
  className: string
  editor: PortableTextEditor
  padding?: string
  readOnly: boolean
  renderBlock: RenderBlockFunction
  selection: EditorSelection
  items: BlockStyleItem[]
  value: BlockStyleItem[]
}

export default function BlockStyleSelect(props: Props): JSX.Element {
  const {className, editor, items, padding, readOnly, renderBlock, value} = props

  const ptFeatures = React.useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [
    editor
  ])

  const handleChange = React.useCallback(
    (item: BlockStyleItem): void => {
      const focusBlock = PortableTextEditor.focusBlock(editor)

      if (focusBlock && item.style !== focusBlock.style) {
        PortableTextEditor.toggleBlockStyle(editor, item.style)
      } else {
        PortableTextEditor.focus(editor)
      }
    },
    [editor]
  )

  const renderItem = React.useCallback(
    (item: BlockStyleItem): JSX.Element => {
      if (item.style) {
        const StyleComponent = item.styleComponent

        return renderBlock(
          {
            _key: '1',
            _type: ptFeatures.types.block.name,
            children: [
              {
                _key: '2',
                _type: ptFeatures.types.span.name,
                text: item.title
              }
            ],
            style: item.style
          },
          ptFeatures.types.block,
          () =>
            StyleComponent ? <StyleComponent>{item.title}</StyleComponent> : <>{item.title}</>,
          {focused: false, selected: false, path: []},
          // @todo: remove this:
          React.createRef()
        )
      }

      return <div key={item.key}>No style</div>
    },
    [ptFeatures]
  )

  const focusBlock = PortableTextEditor.focusBlock(editor)
  const disabled = focusBlock ? ptFeatures.types.block.name !== focusBlock._type : false

  return (
    <label className={className}>
      <span style={{display: 'none'}}>Text</span>
      <StyleSelect
        disabled={readOnly || disabled}
        items={items}
        onChange={handleChange}
        padding={padding}
        renderItem={renderItem}
        transparent
        value={value}
      />
    </label>
  )
}
