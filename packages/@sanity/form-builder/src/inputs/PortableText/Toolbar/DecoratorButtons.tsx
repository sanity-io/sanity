import React from 'react'
import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import FormatCodeIcon from 'part:@sanity/base/format-code-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import styles from './DecoratorButtons.css'
import {
  PortableTextEditor,
  PortableTextFeature,
  EditorSelection,
  HotkeyOptions
} from '@sanity/portable-text-editor'

type DecoratorItem = PortableTextFeature & {
  active: boolean
  disabled: boolean
  icon: Function
}

type Props = {
  editor: PortableTextEditor
  hotkeys: HotkeyOptions
  selection: EditorSelection
}

function getIcon(type: string, schemaIcon?: Function | string): Function {
  switch (type) {
    case 'strong':
      return FormatBoldIcon
    case 'em':
      return FormatItalicIcon
    case 'underline':
      return FormatUnderlinedIcon
    case 'strike-through':
      return FormatStrikethroughIcon
    case 'code':
      return FormatCodeIcon
    default:
      return schemaIcon || SanityLogoIcon
  }
}
export default class DecoratorButtons extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props): boolean {
    if (nextProps.selection !== this.props.selection) {
      return true
    }
    return false
  }
  getItems(): DecoratorItem[] {
    const {editor, selection} = this.props
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const focusBlock = PortableTextEditor.focusBlock(editor)
    return ptFeatures.decorators.map<DecoratorItem>(decorator => ({
      ...decorator,
      icon: getIcon(decorator.value, decorator.blockEditor && decorator.blockEditor.icon),
      active: PortableTextEditor.isMarkActive(editor, decorator.value),
      disabled:
        !selection || (focusBlock ? ptFeatures.types.block.name !== focusBlock._type : false)
    }))
  }
  handleClick = (item: DecoratorItem): void => {
    const {editor} = this.props
    PortableTextEditor.toggleMark(editor, item.value)
  }
  renderDecoratorButton = (item: DecoratorItem): JSX.Element => {
    const icon = item.icon || (item.blockEditor && item.blockEditor.icon)
    const Icon = icon || getIcon(item.value)
    const onAction = (): void => {
      this.handleClick(item)
    }
    const shortCutKey = Object.keys(this.props.hotkeys.marks).find(
      key => this.props.hotkeys.marks[key] === item.value
    )
    let shortCut = ''
    if (shortCutKey) {
      shortCut = ` (${shortCutKey})`
    }
    const title = `${item.title} ${shortCut}`
    return (
      <div key={item.value}>
        <ToggleButton
          selected={!!item.active}
          disabled={item.disabled}
          onClick={onAction}
          title={title}
          icon={Icon}
          padding="small"
        />
      </div>
    )
  }
  render(): JSX.Element {
    const items = this.getItems()

    return <div className={styles.root}>{items.map(this.renderDecoratorButton)}</div>
  }
}
