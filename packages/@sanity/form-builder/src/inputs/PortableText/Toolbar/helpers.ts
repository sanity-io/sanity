import {PortableTextEditor, PortableTextFeature} from '@sanity/portable-text-editor'
import {BlockStyleItem} from './types'

export function getBlockStyleSelectProps(
  editor: PortableTextEditor
): {items: BlockStyleItem[]; value: BlockStyleItem[]} {
  // const {editor} = props
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)

  const items = ptFeatures.styles.map((style: PortableTextFeature) => {
    // const StyleComponent =
    return {
      active: PortableTextEditor.hasBlockStyle(editor, style.value),
      key: `style-${style.value}`,
      // preview: () => renderStyle(style, StyleComponent),
      style: style.value,
      styleComponent: style && style.blockEditor && style.blockEditor.render,
      title: style.title
    }
  })

  let value = items.filter(item => item.active)

  if (value.length === 0 && items.length > 1) {
    items.push({
      key: 'style-none',
      style: null,
      styleComponent: null,
      // preview: noStylePreview,
      title: ' No style',
      active: true
    })
    value = items.slice(-1)
  }

  return {
    items,
    value
  }
}
