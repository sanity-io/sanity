import React, {PropTypes} from 'react'
import BlockFormatSelect from './BlockFormatSelect'
import styles from './styles/ListFormat.css'
import {isEqual, pick} from 'lodash'

import ToggleButton from 'part:@sanity/components/toggles/button'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

import {
  SLATE_DEFAULT_NODE,
  SLATE_LIST_BLOCKS,
  SLATE_LIST_ITEM_TYPE,
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
} from '../constants'

export default class ListFormat extends React.Component {

  static propTypes = {
    children: PropTypes.node,
    groupedFields: PropTypes.object,
    value: PropTypes.object,
    onChange: PropTypes.func,
    slateSchema: PropTypes.object
  }

  // constructor(props, context) {
  //   super(props, context)
  // }

  getIcon(type) {
    switch (type) {
      case 'number':
        return FormatListNumberedIcon
      case 'bullet':
        return FormatListBulletedIcon
      default:
        return SanityLogoIcon
    }
  }

  hasBlock(field) {
    const {value} = this.props
    return value.state.blocks.some(node => node.type === field.type
        && isEqual(
          pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(node.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    )
  }

  hasParentBlock(field) {
    const {value} = this.props
    const {state} = value
    const {document} = state
    return state.blocks.some(node => {
      const parent = document.getParent(node)
      return parent && parent.data && parent.type === field.type
        && isEqual(
          pick(field, SLATE_BLOCK_FORMATTING_OPTION_KEYS),
          pick(parent.data.toObject(), SLATE_BLOCK_FORMATTING_OPTION_KEYS)
        )
    })
  }

  renderButton = item => {
    // const isActive = this.hasMark(type)
    const onClick = event => {
      this.handleSelectListFormatting(event, item)
    }
    // const Icon = this.getIcon(type)
    const Icon = this.getIcon(item.field.listStyle)
    return (
      <ToggleButton
        key={item.key}
        selected={item.isActive}
        onClick={onClick}
        title={item.title}
      >
        <div className={styles.iconContainer}>
          <Icon />
        </div>
      </ToggleButton>
    )
  }

  handleSelectListFormatting = (event, selectedValue) => {
    const {value, onChange} = this.props
    const {state} = value
    let setBlock = {
      type: selectedValue.field.type,
      data: pick(selectedValue.field, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
    }

    if (selectedValue.isActive) {
      const defaultField = this.props.groupedFields.slate.find(field => field.type === SLATE_DEFAULT_NODE)
      setBlock = {
        type: defaultField.type,
        data: pick(defaultField, SLATE_BLOCK_FORMATTING_OPTION_KEYS)
      }
    }

    let transform = state.transform()

    SLATE_LIST_BLOCKS.forEach(type => {
      transform = transform.unwrapBlock(type)
    })

    if (setBlock.type === SLATE_DEFAULT_NODE) {
      transform.setBlock(setBlock)
    } else {
      transform = transform
        .setBlock(SLATE_LIST_ITEM_TYPE)
        .wrapBlock(setBlock)
    }
    const nextState = transform.apply()
    onChange({patch: {localState: nextState}})
  }

  render() {
    const {groupedFields} = this.props
    if (!groupedFields.slate.filter(field => SLATE_LIST_BLOCKS.includes(field.type)).length) {
      return null
    }
    // const listItemField = groupedFields.slate.find(field => field.type === SLATE_LIST_ITEM_TYPE)
    // const defaultField = groupedFields.slate.find(field => field.type === SLATE_DEFAULT_NODE)
    const items = groupedFields.slate
      .filter(field => SLATE_LIST_BLOCKS.includes(field.type))
      .map((field, index) => {
        return {
          key: `listFormat-${index}`,
          field: field,
          title: ` ${field.title}`,
          isMultiple: false,
          isActive: this.hasParentBlock(field)
        }
      })
    return (
      <div className={styles.root}>
        {
          items.map(item => this.renderButton(item))
        }
      </div>
    )
  }
}
