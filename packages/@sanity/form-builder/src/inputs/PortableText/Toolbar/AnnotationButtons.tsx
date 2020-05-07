import React from 'react'
import {get} from 'lodash'
import LinkIcon from 'part:@sanity/base/link-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import CustomIcon from './CustomIcon'
import styles from './AnnotationButtons.css'
import CollapsibleButtonGroup from './CollapsibleButtonGroup'
import {Path} from '../../../typedefs/path'
import {
  PortableTextEditor,
  PortableTextFeature,
  EditorSelection,
  keyGenerator
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

type AnnotationItem = PortableTextFeature & {
  active: boolean
  disabled: boolean
  icon?: Function
}

type Props = {
  editor: PortableTextEditor
  selection: EditorSelection
  onFocus: (arg0: Path) => void
  collapsed: boolean
}
function getIcon(type: string): Function {
  switch (type) {
    case 'link':
      return LinkIcon
    default:
      return SanityLogoIcon
  }
}
function getIconFromItem(item: AnnotationItem): Function {
  return (
    item.icon ||
    get(item, 'blockEditor.icon') ||
    get(item, 'type.icon') ||
    get(item, 'type.to.icon') ||
    get(item, 'type.to[0].icon')
  )
}

export default class AnnotationButtons extends React.PureComponent<Props, {}> {
  getItems(): AnnotationItem[] {
    const {editor} = this.props
    const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    const activeAnnotations = PortableTextEditor.activeAnnotations(editor)
    const focusChild = PortableTextEditor.focusChild(editor)
    return ptFeatures.annotations.map((item: AnnotationItem) => {
      return {
        ...item,
        active: !!activeAnnotations.find(an => an._type === item.type.name),
        disabled: !focusChild || PortableTextEditor.isVoid(editor, focusChild)
      }
    })
  }
  handleClick = (item: AnnotationItem): void => {
    const {editor, onFocus} = this.props
    if (item.active) {
      PortableTextEditor.removeAnnotation(editor, item.type)
      PortableTextEditor.focus(editor)
      return
    }
    const paths = PortableTextEditor.addAnnotation(editor, item.type)
    if (paths.markDefPath) {
      onFocus(paths.markDefPath.concat(FOCUS_TERMINATOR))
    }
  }
  renderAnnotationButton = (item: AnnotationItem): JSX.Element => {
    let Icon
    const icon = getIconFromItem(item)
    if (icon) {
      if (typeof icon === 'string') {
        Icon = (): JSX.Element => <CustomIcon icon={icon} active={!!item.active} />
      } else if (typeof icon === 'function') {
        Icon = icon
      }
    }
    Icon = Icon || getIcon(item.value)
    const onAction = (): void => {
      this.handleClick(item)
    }
    return (
      <ToggleButton
        key={keyGenerator()}
        selected={item.active}
        disabled={item.disabled}
        onClick={onAction}
        title={item.title}
        icon={Icon}
      />
    )
  }
  render(): JSX.Element {
    const {collapsed} = this.props
    const items = this.getItems()
    let Icon
    const icon = getIconFromItem(items[0])
    if (icon) {
      if (typeof icon === 'string') {
        Icon = (): JSX.Element => <CustomIcon icon={icon} active={items[0].active} />
      } else if (typeof icon === 'function') {
        Icon = icon
      }
    }
    if (items.length > 1 && collapsed) {
      return (
        <CollapsibleButtonGroup icon={Icon || getIcon(items[0].value)}>
          <div className={styles.root}>{items.map(this.renderAnnotationButton)}</div>
        </CollapsibleButtonGroup>
      )
    }
    return <div className={styles.root}>{items.map(this.renderAnnotationButton)}</div>
  }
}
