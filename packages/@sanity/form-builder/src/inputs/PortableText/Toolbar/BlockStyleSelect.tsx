// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

/* eslint-disable react/no-multi-comp */

import React, {useEffect, useState, useCallback, useMemo} from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import {
  PortableTextEditor,
  RenderBlockFunction,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {BlockStyleItem} from './types'

type Props = {
  className: string
  disabled: boolean
  padding?: string
  readOnly: boolean
  renderBlock: RenderBlockFunction
  items: BlockStyleItem[]
  value: BlockStyleItem[]
}

const preventDefault = (event: any) => event.preventDefault()

export default function BlockStyleSelect(props: Props): JSX.Element {
  const {className, disabled, items, padding, readOnly, renderBlock, value} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const [changed, setChanged] = useState(false)

  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const spanType = useMemo(() => ptFeatures.types.span, [ptFeatures])
  const blockType = useMemo(() => ptFeatures.types.block, [ptFeatures])

  // Use this effect to set focus back into the editor when the new value get's in.
  useEffect(() => {
    if (changed) {
      PortableTextEditor.focus(editor)
      setChanged(false)
    }
  }, [value, changed, editor])

  const handleChange = useCallback(
    (item: BlockStyleItem): void => {
      const focusBlock = selection && PortableTextEditor.focusBlock(editor)
      if (focusBlock && item.style !== focusBlock.style) {
        PortableTextEditor.toggleBlockStyle(editor, item.style)
      }
      setChanged(true)
    },
    [editor, selection]
  )

  const renderItem = useCallback(
    (item: BlockStyleItem): JSX.Element => {
      if (item.style) {
        const StyleComponent = item.styleComponent

        return renderBlock(
          {
            _key: '1',
            _type: blockType.name,
            children: [
              {
                _key: '2',
                _type: spanType.name,
                text: item.title,
              },
            ],
            style: item.style,
          },
          blockType,
          {focused: false, selected: false, path: []},
          () =>
            StyleComponent ? <StyleComponent>{item.title}</StyleComponent> : <>{item.title}</>,
          // @todo: remove this:
          React.createRef()
        )
      }

      return <div key={item.key}>No style</div>
    },
    [blockType, renderBlock, spanType]
  )

  const focusBlock = useMemo(() => selection && PortableTextEditor.focusBlock(editor), [
    editor,
    selection,
  ])

  // @todo: Document what's going on here
  const _disabled = focusBlock ? blockType.name !== focusBlock._type : false
  return (
    <label className={className}>
      <span style={{display: 'none'}}>Text</span>
      <StyleSelect
        onClick={preventDefault}
        disabled={readOnly || disabled || _disabled}
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
