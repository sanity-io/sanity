import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import BlockObjectIcon from 'part:@sanity/base/block-object-icon'
import InlineObjectIcon from 'part:@sanity/base/inline-object-icon'
import {Tooltip} from 'react-tippy'
import {get} from 'lodash'
import {SlateEditor, SlateValue, Type} from '../typeDefs'
import styles from './styles/InsertMenu.css'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Path} from '../../../typedefs/path'

type Props = {
  blockTypes: Type[]
  editor: SlateEditor
  editorValue: SlateValue
  inlineTypes: Type[]
  onFocus: (arg0: Path) => void
  collapsed: boolean
  showLabels: boolean
}

type BlockItem = {
  title: string
  value: Type
  icon: any
  key: string
  isInline: boolean
  isDisabled: boolean
}
export default class InsertMenu extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return (
      this.props.collapsed !== nextProps.collapsed ||
      this.props.blockTypes !== nextProps.blockTypes ||
      this.props.inlineTypes !== nextProps.inlineTypes ||
      this.props.editorValue.focusBlock !== nextProps.editorValue.focusBlock
    )
  }

  renderItem = (item: BlockItem) => {
    const Icon = item.icon
    return (
      <div className={styles.item}>
        {Icon && (
          <div className={styles.icon}>
            <Icon />
          </div>
        )}
        {item.title}
      </div>
    )
  }
  renderButton = (item: BlockItem) => {
    const {showLabels} = this.props
    return (
      <Tooltip
        title={`Insert ${item.title}`}
        disabled={this.props.collapsed}
        key={`insertMenuItem_${item.key}`}
        style={showLabels ? {display: 'block', flexGrow: 1, minWidth: 'fit-content'} : {}}
      >
        <Button
          onClick={() => this.handleOnAction(item)}
          title={`Insert ${item.title}`}
          aria-label={`Insert ${item.title}`}
          icon={item.icon}
          kind="simple"
          bleed
        >
          {showLabels && item.title}
        </Button>
      </Tooltip>
    )
  }
  getIcon = (type: Type, fallbackIcon: any) => {
    const referenceIcon = get(type, 'to[0].icon')
    return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
  }

  getItems(): BlockItem[] {
    const {editor} = this.props
    const {focusBlock} = editor.value
    let keyCount = 0
    const blockItems = this.props.blockTypes.map(
      (type, index): BlockItem => ({
        title: type.title,
        value: type,
        key: (keyCount++).toString(),
        icon: this.getIcon(type, BlockObjectIcon),
        isInline: false,
        isDisabled: false
      })
    )
    const inlineItems = this.props.inlineTypes.map(
      (type, index): BlockItem => ({
        title: type.title,
        icon: this.getIcon(type, InlineObjectIcon),
        value: type,
        key: (keyCount++).toString(),
        isInline: true,
        isDisabled: focusBlock ? editor.query('isVoid', focusBlock) : true
      })
    )
    return blockItems.concat(inlineItems)
  }

  handleOnAction = (item: BlockItem) => {
    const {onFocus, editor} = this.props
    if (item.isInline) {
      editor.command('insertInlineObject', {objectType: item.value})
      setTimeout(
        () =>
          onFocus([
            {_key: editor.value.focusBlock.key},
            'children',
            {_key: editor.value.focusInline.key},
            FOCUS_TERMINATOR
          ]),
        200
      )
    } else {
      editor.command('insertBlockObject', {objectType: item.value})
      setTimeout(() => onFocus([{_key: editor.value.focusBlock.key}, FOCUS_TERMINATOR]), 200)
    }
  }

  render() {
    const {collapsed} = this.props
    const items = this.getItems()
    if (!collapsed) {
      return items.map(this.renderButton)
    }
    return (
      <DropDownButton
        items={items}
        renderItem={this.renderItem}
        onAction={this.handleOnAction}
        kind="simple"
      >
        Insert
      </DropDownButton>
    )
  }
}
