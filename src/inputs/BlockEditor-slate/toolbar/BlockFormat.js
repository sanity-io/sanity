import React, {PropTypes} from 'react'
import styles from './styles/Toolbar.css'
import {isEqual, pick} from 'lodash'
import CustomSelect from 'part:@sanity/components/selects/custom'

import {
  SLATE_LIST_ITEM_TYPE,
  SLATE_TEXT_BLOCKS,
  SLATE_BLOCK_FORMATTING_OPTION_KEYS
} from '../constants'

export default class Toolbar extends React.Component {

  static propTypes = {
    groupedFields: PropTypes.object,
    value: PropTypes.object,
    slateSchema: PropTypes.object,
    onSelect: PropTypes.func
  }

  hasBlock = field => {
    const {value} = this.props
    return value.state.blocks.some(node => node.type === field.type
        && isEqual(
          pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(node.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    )
  }

  isWithinList = () => {
    const {value} = this.props
    const {state} = value
    return state.blocks.some(block => block.type === SLATE_LIST_ITEM_TYPE)
  }

  renderItem = item => {
    const node = this.props.slateSchema.nodes[item.field.type]
    return (
      <div>
        {node(
          Object.assign(
            {isPreview: true},
            {children: <span>{item.title}</span>},
            pick(item.field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
          ))
        }
      </div>
    )
  }

  render() {
    const {groupedFields} = this.props

    if (!groupedFields.slate.length) {
      return null
    }
    let value = null
    let items = groupedFields.slate
      .filter(field => {
        return this.isWithinList()
          ? SLATE_TEXT_BLOCKS.concat(SLATE_LIST_ITEM_TYPE).includes(field.type)
          : SLATE_TEXT_BLOCKS.includes(field.type)
      })
      .map((field, index) => {
        return {
          key: `blockFormat-${index}`,
          isMultiple: false,
          // preview: this.slateSchema.nodes[field.type],
          field: field,
          disabled: field.type === SLATE_LIST_ITEM_TYPE,
          title: ` ${field.title}`,
          isActive: this.hasBlock(field)
        }
      })
    const activeItems = items.filter(item => item.isActive)
    const hasMultipleFormatting = activeItems.length > 1

    if (hasMultipleFormatting) {
      items = items.map(item => {
        if (item.isActive) {
          return Object.assign(item, {isActive: false, isMultiple: true})
        }
        return item
      })
      value = {
        key: 'blockFormat-multiple',
        preview: () => <div>Multiple</div>,
        field: null,
        title: 'Multiple',
        isActive: true
      }
    }
    if (activeItems.length === 0) {
      value = {
        key: 'blockFormat-none',
        preview: () => <div>None</div>,
        field: null,
        title: 'None',
        isActive: true
      }
    }
    // return (
    //   <BlockFormatSelect
    //     items={items}
    //     label="Text"
    //     value={value || items.find(item => item.isActive)}
    //     onChange={this.handleSelectBlockFormatting}
    //   />
    // )
    return (
      <CustomSelect
        label="Text"
        items={items}
        value={value || items.find(item => item.isActive)}
        onChange={this.props.onSelect}
        renderItem={this.renderItem}
      />
    )
  }
}
