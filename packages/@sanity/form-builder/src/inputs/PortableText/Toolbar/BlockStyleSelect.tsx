import React from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import {
  EditorSelection,
  PortableTextEditor,
  PortableTextFeature,
  StyledComponents
} from '@sanity/portable-text-editor'
export type BlockStyleItem = {
  active: boolean
  key: string
  preview: JSX.Element
  style: string
  title: string
}
type Props = {
  className: string
  editor: PortableTextEditor
  selection: EditorSelection
}

export default class BlockStyleSelect extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props): boolean {
    if (nextProps.selection && nextProps.selection !== this.props.selection) {
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
          active: PortableTextEditor.hasBlockStyle(editor, style.value),
          key: `style-${style.value}`,
          preview: preview,
          style: style.value,
          title: ` ${style.title}`
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
          disabled={disabled}
          items={items}
          onChange={this.handleChange}
          renderItem={this.renderItem}
          transparent
          value={value}
        />
      </label>
    )
  }
}
