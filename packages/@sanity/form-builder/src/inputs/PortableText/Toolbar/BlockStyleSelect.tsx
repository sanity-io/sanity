import React from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import {
  StyledComponents,
  PortableTextEditor,
  PortableTextFeature,
  EditorSelection
} from '@sanity/portable-text-editor'
export type BlockStyleItem = {
  key: string
  active: boolean
  title: string
  style: string
  preview: JSX.Element
}
type Props = {
  editor: PortableTextEditor
  className: string
  selection: EditorSelection
}

export default class BlockStyleSelect extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props): boolean {
    if (nextProps.selection !== this.props.selection) {
      return true
    }
    return false
  }
  getItemsAndValue(): {
    items: BlockStyleItem[]
    value: BlockStyleItem[]
  } {
    const {editor} = this.props
    const items = PortableTextEditor.getPortableTextFeatures(editor).styles.map(
      (style: PortableTextFeature) => {
        const styleComponent = style && style.blockEditor && style.blockEditor.render
        const preview: JSX.Element = (
          <StyledComponents.Text style={style.value} styleComponent={styleComponent}>
            {style.title}
          </StyledComponents.Text>
        )
        return {
          key: `style-${style.value}`,
          style: style.value,
          preview: preview,
          title: ` ${style.title}`,
          active: PortableTextEditor.hasBlockStyle(editor, style.value)
        }
      }
    )
    let value = items.filter(item => item.active)
    if (value.length === 0 && items.length > 1) {
      items.push({
        key: 'style-none',
        style: null,
        preview: <div>No style</div>,
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
  handleChange = (item: BlockStyleItem): void => {
    const {editor} = this.props
    PortableTextEditor.toggleBlockStyle(editor, item.style)
  }
  renderItem = (item: BlockStyleItem): JSX.Element => {
    return item.preview
  }
  render(): JSX.Element {
    const {items, value} = this.getItemsAndValue()
    // If just one style, don't show
    if (!items || items.length < 2) {
      return null
    }
    const {className, editor} = this.props
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const focusBlock = PortableTextEditor.focusBlock(editor)
    const disabled = focusBlock ? ptFeatures.types.block.name !== focusBlock._type : false
    return (
      <label className={className}>
        <span style={{display: 'none'}}>Text</span>
        <StyleSelect
          items={items}
          value={value}
          disabled={disabled}
          onChange={this.handleChange}
          renderItem={this.renderItem}
          transparent
        />
      </label>
    )
  }
}
