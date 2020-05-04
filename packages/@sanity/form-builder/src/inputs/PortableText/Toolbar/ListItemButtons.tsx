import React from 'react'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import CustomIcon from './CustomIcon'
import CollapsibleButtonGroup from './CollapsibleButtonGroup'
import styles from './ListItemButtons.css'
import {
  PortableTextFeature,
  PortableTextEditor,
  EditorSelection
} from '@sanity/portable-text-editor'

type ListItem = PortableTextFeature & {
  active: boolean
  disabled: boolean
}
type Props = {
  editor: PortableTextEditor
  selection: EditorSelection
  collapsed: boolean
}
function getIcon(type: string): JSX.ElementClass {
  switch (type) {
    case 'number':
      return FormatListNumberedIcon
    case 'bullet':
      return FormatListBulletedIcon
    default:
      return SanityLogoIcon
  }
}
export default class ListItemButtons extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props): boolean {
    if (nextProps.collapsed !== this.props.collapsed) {
      return true
    }
    if (nextProps.selection !== this.props.selection) {
      return true
    }
    return false
  }
  getItems(): ListItem[] {
    const {editor} = this.props
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const focusBlock = PortableTextEditor.focusBlock(editor)
    return ptFeatures.lists.map((listItem: PortableTextFeature) => {
      return {
        ...listItem,
        active: focusBlock ? focusBlock.listItem === listItem.value : false,
        disabled: focusBlock ? ptFeatures.types.block.name !== focusBlock._type : false
      }
    })
  }
  handleClick = (item: ListItem): void => {
    const {editor} = this.props
    PortableTextEditor.toggleList(editor, item.value)
  }
  renderListItemButton = (item: ListItem): JSX.Element => {
    let Icon
    const icon = item.blockEditor ? item.blockEditor.icon : null
    if (icon) {
      if (typeof icon === 'string') {
        Icon = (): JSX.Element => <CustomIcon icon={icon} active={!!item.active} />
      } else if (typeof icon === 'function') {
        Icon = icon
      }
    }
    Icon = Icon || getIcon(item.value)
    const onAction = (): void => this.handleClick(item)
    return (
      <ToggleButton
        selected={item.active}
        disabled={item.disabled}
        onClick={onAction}
        aria-label={`Toggle '${item.title}' list`}
        title={`Toggle '${item.title}' list`}
        icon={Icon}
      />
    )
  }
  render(): JSX.Element {
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
