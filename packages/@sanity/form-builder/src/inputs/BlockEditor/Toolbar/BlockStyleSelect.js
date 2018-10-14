// @flow
import React from 'react'

import StyleSelect from 'part:@sanity/components/selects/style'

import Text from '../nodes/Text'

import type {
  BlockContentFeature,
  BlockContentFeatures,
  SlateValue,
  SlateController
} from '../typeDefs'

export type BlockStyleItem = {
  key: string,
  active: boolean,
  title: string,
  style: string,
  preview: Node
}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  controller: SlateController,
  editorValue: SlateValue
}

export default class BlockStyleSelect extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const nextFocusBlock = nextProps.editorValue.focusBlock
    const currentFocusBlock = this.props.editorValue.focusBlock
    if (nextProps.editorValue.blocks.size > 1) {
      return true
    }
    if ((nextFocusBlock && nextFocusBlock.key) !== (currentFocusBlock && currentFocusBlock.key)) {
      return true
    }
    return nextFocusBlock.data.get('style') !== currentFocusBlock.data.get('style')
  }

  getItemsAndValue() {
    const {blockContentFeatures, controller} = this.props
    const items = blockContentFeatures.styles.map((style: BlockContentFeature) => {
      const styleComponent = style && style.blockEditor && style.blockEditor.render
      const preview = (
        <Text attributes={{}} style={style.value} styleComponent={styleComponent}>
          {style.title}
        </Text>
      )
      return {
        key: `style-${style.value}`,
        style: style.value,
        preview: preview,
        title: ` ${style.title}`,
        active: controller.query('hasStyle', style.value)
      }
    })
    let value = items.filter(item => item.active)
    if (value.length === 0) {
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
    const {controller} = this.props
    controller.command('setBlockStyle', item.style)
    this.forceUpdate()
  }

  renderItem = (item: BlockStyleItem) => {
    return item.preview
  }

  render() {
    const {items, value} = this.getItemsAndValue()
    if (!items || items.length === 0) {
      return null
    }
    const {editorValue} = this.props
    const {focusBlock} = editorValue
    const disabled = focusBlock ? focusBlock.isVoid : false
    return (
      <label>
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
