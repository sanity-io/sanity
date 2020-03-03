import React from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import Text from '../nodes/Text'
import {BlockContentFeature, BlockContentFeatures, SlateValue, SlateEditor} from '../typeDefs'
export type BlockStyleItem = {
  key: string
  active: boolean
  title: string
  style: string
  preview: Node
}
type Props = {
  blockContentFeatures: BlockContentFeatures
  editor: SlateEditor
  editorValue: SlateValue
  className: string
}
export default class BlockStyleSelect extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    const nextFocusBlock = nextProps.editorValue.focusBlock
    const currentFocusBlock = this.props.editorValue.focusBlock
    if (nextProps.editorValue.blocks.size > 1) {
      return true
    }
    if ((nextFocusBlock && nextFocusBlock.key) !== (currentFocusBlock && currentFocusBlock.key)) {
      return true
    }
    return (
      (nextFocusBlock && nextFocusBlock.data.get('style')) !==
      (currentFocusBlock && currentFocusBlock.data.get('style'))
    )
  }
  getItemsAndValue() {
    const {blockContentFeatures, editor} = this.props
    const items = blockContentFeatures.styles.map((style: BlockContentFeature) => {
      const styleComponent = style && style.blockEditor && style.blockEditor.render
      const preview = (
        <Text style={style.value} styleComponent={styleComponent}>
          {style.title}
        </Text>
      )
      return {
        key: `style-${style.value}`,
        style: style.value,
        preview: preview,
        title: ` ${style.title}`,
        active: editor.query('hasStyle', style.value)
      }
    })
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
  handleChange = (item: BlockStyleItem) => {
    const {editor} = this.props
    editor.command('setBlockStyle', item.style)
    editor.command('focusNoScroll')
    this.forceUpdate()
  }
  renderItem = (item: BlockStyleItem) => {
    return item.preview
  }
  render() {
    const {items, value} = this.getItemsAndValue()
    if (!items || items.length < 2) {
      return null
    }
    const {editorValue, className} = this.props
    const {focusBlock} = editorValue
    const disabled = focusBlock ? focusBlock.isVoid : false
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
