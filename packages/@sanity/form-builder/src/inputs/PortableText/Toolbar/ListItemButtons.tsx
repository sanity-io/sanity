import React from 'react'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import {BlockContentFeature, BlockContentFeatures, SlateEditor, SlateValue} from '../typeDefs'
import CustomIcon from './CustomIcon'
import ToolbarClickAction from './ToolbarClickAction'
import CollapsibleButtonGroup from './CollapsibleButtonGroup'
import styles from './styles/ListItemButtons.css'
type ListItem = BlockContentFeature & {
  active: boolean
  disabled: boolean
}
type Props = {
  blockContentFeatures: BlockContentFeatures
  editor: SlateEditor
  editorValue: SlateValue
  collapsed: boolean
}
function getIcon(type: string) {
  switch (type) {
    case 'number':
      return FormatListNumberedIcon
    case 'bullet':
      return FormatListBulletedIcon
    default:
      return SanityLogoIcon
  }
}
const NOOP = () => {}
export default class ListItemButtons extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    const nextFocusBlock = nextProps.editorValue.focusBlock
    const currentFocusBlock = this.props.editorValue.focusBlock
    // Always update if we have selected more than one block
    if (nextProps.editorValue.blocks.size > 1) {
      return true
    }
    if (nextProps.collapsed != this.props.collapsed) {
      return true
    }
    // Update if we have navigated to another block, or the block's data litItem prop is changed
    if (
      (nextFocusBlock && nextFocusBlock.key) !== (currentFocusBlock && currentFocusBlock.key) ||
      (nextFocusBlock && nextFocusBlock.data.get('listItem')) !==
        (currentFocusBlock && currentFocusBlock.data.get('listItem'))
    ) {
      return true
    }
    return false
  }
  hasListItem(listItemName: string) {
    const {editor} = this.props
    return editor.value.blocks.some(block => {
      return block.data.get('listItem') === listItemName
    })
  }
  getItems() {
    const {editor, blockContentFeatures} = this.props
    const {focusBlock} = editor.value
    const disabled = focusBlock ? editor.query('isVoid', focusBlock) : false
    return blockContentFeatures.lists.map((listItem: BlockContentFeature) => {
      return {
        ...listItem,
        active: editor.query('hasListItem', listItem.value),
        disabled
      }
    })
  }
  handleClick = (item: ListItem) => {
    const {editor} = this.props
    editor.command('toggleListItem', item.value)
    this.forceUpdate()
  }
  renderListItemButton = (item: ListItem) => {
    const {editor} = this.props
    let Icon
    const icon = item.blockEditor ? item.blockEditor.icon : null
    if (icon) {
      if (typeof icon === 'string') {
        Icon = () => <CustomIcon icon={icon} active={!!item.active} />
      } else if (typeof icon === 'function') {
        Icon = icon
      }
    }
    Icon = Icon || getIcon(item.value)
    const onAction = () => this.handleClick(item)
    return (
      <ToolbarClickAction onAction={onAction} editor={editor} key={`listItemButton${item.value}`}>
        <ToggleButton
          selected={item.active}
          disabled={item.disabled}
          onClick={NOOP}
          title={item.title}
          icon={Icon}
        />
      </ToolbarClickAction>
    )
  }
  render() {
    const {collapsed} = this.props
    const items = this.getItems()
    const icon = items[0].blockEditor ? items[0].blockEditor.icon : null
    if (items.length > 0 && collapsed) {
      return (
        <CollapsibleButtonGroup icon={icon || getIcon(items[0].value)}>
          {items.map(this.renderListItemButton)}
        </CollapsibleButtonGroup>
      )
    }
    return <div className={styles.root}>{items.map(this.renderListItemButton)}</div>
  }
}
