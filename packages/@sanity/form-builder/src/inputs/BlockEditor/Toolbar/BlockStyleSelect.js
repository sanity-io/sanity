// @flow

import type {BlockContentFeature, BlockContentFeatures, SlateChange, SlateValue} from '../typeDefs'

import React from 'react'
import {Block} from 'slate'

import {setBlockStyle} from '../utils/changes'

import ContentBlock from '../nodes/ContentBlock'
import StyleSelect from 'part:@sanity/components/selects/style'

import styles from './styles/BlockStyleSelect.css'

export type BlockStyleItem = {
  key: string,
  active: boolean,
  title: string,
  style: string,
  preview: Node
}

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  onChange: (change: SlateChange) => void
}

export default class BlockStyleSelect extends React.Component<Props> {
  hasStyle(styleName: string) {
    const {editorValue} = this.props
    return editorValue.blocks.some(block => block.data.get('style') === styleName)
  }

  getItemsAndValue() {
    const {blockContentFeatures} = this.props
    const items = blockContentFeatures.styles.map((style: BlockContentFeature) => {
      const block = Block.create({
        type: 'contentBlock',
        data: {style: style.value}
      })
      const preview = (
        <ContentBlock node={block} blockContentFeatures={blockContentFeatures}>
          {style.title}
        </ContentBlock>
      )
      return {
        key: `style-${style.value}`,
        style: style.value,
        preview: preview,
        title: ` ${style.title}`,
        active: this.hasStyle(style.value)
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
    const {onChange, editorValue} = this.props
    const change = editorValue.change()
    change.call(setBlockStyle, item.style)
    change.focus()
    onChange(change)
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
      <label className={styles.root}>
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
