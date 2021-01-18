/* eslint-disable react/no-multi-comp */
import React, {useEffect, useState} from 'react'
import {
  EditorSelection,
  PortableTextEditor,
  RenderBlockFunction,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {StyleSelect} from '../../../../legacyParts'
import {BlockStyleItem} from './types'

type Props = {
  className: string
  disabled: boolean
  padding?: string
  readOnly: boolean
  renderBlock: RenderBlockFunction
  selection: EditorSelection
  items: BlockStyleItem[]
  value: BlockStyleItem[]
}

export default function BlockStyleSelect(props: Props): JSX.Element {
  const {className, disabled, items, padding, readOnly, renderBlock, value, selection} = props
  const editor = usePortableTextEditor()
  const [changed, setChanged] = useState(false)

  const features = React.useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])

  // Use this effect to set focus back into the editor when the new value get's in.
  useEffect(() => {
    if (changed) {
      PortableTextEditor.focus(editor)
      setChanged(false)
    }
  }, [value, changed])

  const handleChange = (item: BlockStyleItem): void => {
    const focusBlock = PortableTextEditor.focusBlock(editor)
    if (focusBlock && item.style !== focusBlock.style) {
      PortableTextEditor.toggleBlockStyle(editor, item.style)
    }
    setChanged(true)
  }

  const renderItem = React.useCallback(
    (item: BlockStyleItem): JSX.Element => {
      if (item.style) {
        const StyleComponent = item.styleComponent

        return renderBlock(
          {
            _key: '1',
            _type: features.types.block.name,
            children: [
              {
                _key: '2',
                _type: features.types.span.name,
                text: item.title,
              },
            ],
            style: item.style,
          },
          features.types.block,
          {focused: false, selected: false, path: []},
          () =>
            StyleComponent ? <StyleComponent>{item.title}</StyleComponent> : <>{item.title}</>,
          // @todo: remove this:
          React.createRef()
        )
      }

      return <div key={item.key}>No style</div>
    },
    [selection]
  )
  const focusBlock = PortableTextEditor.focusBlock(editor)

  // @todo: Document what's going on here
  const _disabled = focusBlock ? features.types.block.name !== focusBlock._type : false
  return (
    <label className={className}>
      <span style={{display: 'none'}}>Text</span>
      <StyleSelect
        onClick={(event) => event.preventDefault()}
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
