import React from 'react'
import {get} from 'lodash'
import LinkIcon from 'part:@sanity/base/link-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ToggleButton from 'part:@sanity/components/toggles/button'
import CustomIcon from './CustomIcon'
import styles from './AnnotationButtons.css'
import CollapsibleButtonGroup from './CollapsibleButtonGroup'
import {Path} from '../../../typedefs/path'
import {PortableTextEditor, PortableTextFeature} from '@sanity/portable-text-editor'

type AnnotationItem = PortableTextFeature & {
  active: boolean
  disabled: boolean
  icon?: any
}

type Props = {
  editor: PortableTextEditor
  onFocus: (arg0: Path) => void
  collapsed: boolean
}
function getIcon(type: string) {
  switch (type) {
    case 'link':
      return LinkIcon
    default:
      return SanityLogoIcon
  }
}
function getIconFromItem(item: AnnotationItem) {
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
    const inlines = [] // TODO: get inlines here
    const disabled =
      // TODO: deal with this?
      // userIsWritingText ||
      // editor.query('hasSelectionWithText') === false ||
      inlines.some(inline => inline.type !== 'span')
    return PortableTextEditor.getPortableTextFeatures(editor).annotations.map(annotation => {
      return {
        ...annotation,
        active: true, // TODO: editor.query('hasAnnotation', annotation.value),
        disabled
      }
    })
  }
  handleClick = (item: AnnotationItem, originalSelection: Range) => {
    // const {editor, onFocus} = this.props
    // if (item.disabled) {
    //   return
    // }
    // const key = randomKey(12)
    // editor.command('toggleAnnotation', {annotationName: item.value, key})
    // if (editor.value.startInline) {
    //   // Make the block editor focus the annotation input if we added an annotation
    //   editor.blur()
    //   const focusPath = [
    //     {_key: editor.value.focusBlock.key},
    //     'markDefs',
    //     {_key: key},
    //     FOCUS_TERMINATOR
    //   ]
    //   setTimeout(() => {
    //     onFocus(focusPath)
    //   }, 200)
    //   return
    // }
    // editor.command('focusNoScroll')
  }
  renderAnnotationButton = (item: AnnotationItem) => {
    const {editor} = this.props
    let Icon
    const icon = getIconFromItem(item)
    if (icon) {
      if (typeof icon === 'string') {
        Icon = () => <CustomIcon icon={icon} active={!!item.active} />
      } else if (typeof icon === 'function') {
        Icon = icon
      }
    }
    Icon = Icon || getIcon(item.value)
    // We must not do a click-event here, because that messes with the editor focus!
    const onAction = (originalSelection: Range) => {
      this.handleClick(item, originalSelection)
    }
    return (
      <ToggleButton
        selected={!!item.active}
        disabled={item.disabled}
        onClick={onAction}
        title={item.title}
        icon={Icon}
      />
    )
  }
  render() {
    const {collapsed} = this.props
    const items = this.getItems()
    let Icon
    const icon = getIconFromItem(items[0])
    if (icon) {
      if (typeof icon === 'string') {
        Icon = () => <CustomIcon icon={icon} active={!!items[0].active} />
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
