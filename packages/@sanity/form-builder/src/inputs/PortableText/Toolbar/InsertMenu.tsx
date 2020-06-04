import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import BlockObjectIcon from 'part:@sanity/base/block-object-icon'
import InlineObjectIcon from 'part:@sanity/base/inline-object-icon'
import {get} from 'lodash'
import styles from './InsertMenu.css'
import {Path} from '../../../typedefs/path'
import {PortableTextEditor, Type, keyGenerator, EditorSelection} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

type Props = {
  editor: PortableTextEditor
  onFocus: (arg0: Path) => void
  showLabels: boolean
  selection: EditorSelection
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
    return nextProps.selection !== this.props.selection
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
      <div key={keyGenerator()}>
        <Button
          onClick={handleAction}
          title={`Insert ${item.title || item.value.type.name}${
            item.isInline ? ' (inline)' : ' (block)'
          }`}
          aria-label={`Insert ${item.title || item.value.type.name}${
            item.isInline ? ' (inline)' : ' (block)'
          }`}
          icon={item.icon}
          kind="simple"
          padding="small"
        >
          {/* {showLabels && item.title} */}
        </Button>
      </div>
    )
  }

  getIcon = (type: Type, fallbackIcon: Function): Function => {
    const referenceIcon = get(type, 'to[0].icon')
    return type.icon || (type.type && type.type.icon) || referenceIcon || fallbackIcon
  }

  getItems(): BlockItem[] {
    const {editor, selection} = this.props
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
        isDisabled: !selection
      })
    )
    const inlineItems = ptFeatures.types.inlineObjects.map(
      (type: Type): BlockItem => ({
        title: type.title,
        icon: this.getIcon(type, InlineObjectIcon),
        value: type,
        key: (keyCount++).toString(),
        isInline: true,
        isDisabled:
          !selection || (focusBlock ? focusBlock._type !== ptFeatures.types.block.name : true)
      })
    )
    return blockItems.concat(inlineItems)
  }

  handleOnAction = (item: BlockItem): void => {
    const {editor, onFocus} = this.props
    let path
    if (item.isInline) {
      path = PortableTextEditor.insertChild(editor, item.value)
    } else {
      path = PortableTextEditor.insertBlock(editor, item.value)
    }
    setTimeout(() => {
      onFocus(path.concat(FOCUS_TERMINATOR))
    })
  }

  render(): JSX.Element | JSX.Element[] {
    const items = this.getItems()

    return <div className={styles.root}>{items.map(this.renderButton)}</div>
  }
}
