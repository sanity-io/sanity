import React from 'react'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import BlockObjectIcon from 'part:@sanity/base/block-object-icon'
import InlineObjectIcon from 'part:@sanity/base/inline-object-icon'
import {get} from 'lodash'
import styles from './InsertMenu.css'
import {Path} from '../../../typedefs/path'
import {PortableTextEditor, Type, keyGenerator} from '@sanity/portable-text-editor'

type Props = {
  editor: PortableTextEditor
  onFocus: (arg0: Path) => void
  collapsed: boolean
  showLabels: boolean
}

type BlockItem = {
  title: string
  value: Type
  icon: Function
  key: string
  isInline: boolean
  isDisabled: boolean
}
export default class InsertMenu extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props): boolean {
    return this.props.collapsed !== nextProps.collapsed
  }

  renderItem = (item: BlockItem): JSX.Element => {
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
  renderButton = (item: BlockItem): JSX.Element => {
    const handleAction = () => this.handleOnAction(item)
    return (
      <Button
        key={keyGenerator()}
        onClick={handleAction}
        title={`Insert ${item.title || item.value.type.name}${
          item.isInline ? ' (inline)' : ' (block)'
        }`}
        aria-label={`Insert ${item.title || item.value.type.name}${
          item.isInline ? ' (inline)' : ' (block)'
        }`}
        icon={item.icon}
        kind="simple"
        bleed
      >
        {/* {showLabels && item.title} */}
      </Button>
      // </Tooltip>
    )
  }

  getIcon = (type: Type, fallbackIcon: Function): Function => {
    const referenceIcon = get(type, 'to[0].icon')
    return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
  }

  getItems(): BlockItem[] {
    const {editor} = this.props
    const focusBlock = PortableTextEditor.focusBlock(editor)
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    let keyCount = 0
    const blockItems = ptFeatures.types.blockObjects.map(
      (type: Type): BlockItem => ({
        title: type.title,
        value: type,
        key: (keyCount++).toString(),
        icon: this.getIcon(type, BlockObjectIcon),
        isInline: false,
        isDisabled: false
      })
    )
    const inlineItems = ptFeatures.types.inlineObjects.map(
      (type: Type): BlockItem => ({
        title: type.title,
        icon: this.getIcon(type, InlineObjectIcon),
        value: type,
        key: (keyCount++).toString(),
        isInline: true,
        isDisabled: focusBlock ? focusBlock._type !== ptFeatures.types.block.name : true
      })
    )
    return blockItems.concat(inlineItems)
  }

  handleOnAction = (item: BlockItem): void => {
    const {editor} = this.props
    if (item.isInline) {
      PortableTextEditor.insertChild(editor, item.value)
    } else {
      PortableTextEditor.insertBlock(editor, item.value)
    }
  }

  render(): JSX.Element | JSX.Element[] {
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
