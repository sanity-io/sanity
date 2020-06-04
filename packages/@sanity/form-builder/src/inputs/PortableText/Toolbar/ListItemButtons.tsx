import React from 'react'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import CustomIcon from './CustomIcon'
import styles from './ListItemButtons.css'
import {
  PortableTextFeature,
  PortableTextEditor,
  EditorSelection,
  keyGenerator
} from '@sanity/portable-text-editor'

type ListItem = PortableTextFeature & {
  active: boolean
  disabled: boolean
}
type Props = {
  editor: PortableTextEditor
  selection: EditorSelection
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
    if (nextProps.selection !== this.props.selection) {
      return true
    }
    return false
  }
  getItems(): ListItem[] {
    const {editor, selection} = this.props
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const focusBlock = PortableTextEditor.focusBlock(editor)
    return ptFeatures.lists.map((listItem: PortableTextFeature) => {
      return {
        ...listItem,
        active: focusBlock ? focusBlock.listItem === listItem.value : false,
        disabled:
          !selection || (focusBlock ? ptFeatures.types.block.name !== focusBlock._type : false)
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
      <div key={keyGenerator()}>
        <ToggleButton
          aria-label={`Toggle '${item.title}' list`}
          disabled={item.disabled}
          icon={Icon}
          onClick={onAction}
          padding="small"
          selected={item.active}
          title={`Toggle '${item.title}' list`}
        />
      </div>
    )
  }
  render(): JSX.Element {
    const items = this.getItems()

    return <div className={styles.root}>{items.map(this.renderListItemButton)}</div>
  }
}
