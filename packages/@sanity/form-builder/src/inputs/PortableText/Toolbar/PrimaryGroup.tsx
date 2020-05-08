/* eslint-disable complexity */
import React from 'react'
import AnnotationButtons from './AnnotationButtons'
import BlockStyleSelect from './BlockStyleSelect'
import DecoratorButtons from './DecoratorButtons'
import InsertMenu from './InsertMenu'
import ListItemButtons from './ListItemButtons'
import styles from './PrimaryGroup.css'
import {Path} from '../../../typedefs/path'
import {
  PortableTextEditor,
  EditorSelection,
  Type,
  HotkeyOptions
} from '@sanity/portable-text-editor'

type Props = {
  collapsedGroups: string[]
  editor: PortableTextEditor
  hotkeys: HotkeyOptions
  insertItems: Type[]
  isMobile?: boolean
  isPopped?: boolean
  onFocus: (path: Path) => void
  selection: EditorSelection
}
type State = {
  collapsePrimary: boolean
  collapsePrimaryIsOpen: boolean
  isMobile: boolean
  lastContentWidth: number
  showValidationTooltip: boolean
}
export default class PrimaryGroup extends React.PureComponent<Props, State> {
  static defaultProps = {
    isMobile: false,
    isPopped: false
  }

  render(): JSX.Element {
    const {
      collapsedGroups,
      editor,
      insertItems,
      isMobile,
      isPopped,
      onFocus,
      selection
    } = this.props
    if (!editor) {
      return null
    }
    const portableTextFeatures = PortableTextEditor.getPortableTextFeatures(editor)
    return (
      <div className={isPopped ? styles.isPopped : styles.root}>
        <div className={styles.blockStyleGroup}>
          <BlockStyleSelect
            className={styles.blockStyleSelect}
            editor={editor}
            selection={this.props.selection}
          />
        </div>
        {portableTextFeatures.decorators.length > 0 && (
          <div className={styles.group}>
            <DecoratorButtons
              collapsed={collapsedGroups.indexOf('decoratorButtons') >= 0}
              editor={editor}
              hotkeys={this.props.hotkeys}
              selection={selection}
            />
          </div>
        )}
        {portableTextFeatures.lists.length > 0 && (
          <div className={styles.group}>
            <ListItemButtons
              collapsed={collapsedGroups.indexOf('listItemButtons') >= 0}
              editor={editor}
              selection={this.props.selection}
            />
          </div>
        )}
        {portableTextFeatures.annotations.length > 0 && (
          <div className={styles.group}>
            <AnnotationButtons
              collapsed={collapsedGroups.indexOf('annotationButtons') >= 0}
              editor={editor}
              onFocus={onFocus}
              selection={this.props.selection}
            />
          </div>
        )}
        {insertItems.length > 0 && (
          <div className={styles.group}>
            <InsertMenu
              collapsed={isMobile || collapsedGroups.indexOf('insertMenu') >= 0}
              editor={editor}
              onFocus={onFocus}
              showLabels={
                portableTextFeatures.types.blockObjects.concat(
                  portableTextFeatures.types.inlineObjects
                ).length < 4
              }
            />
          </div>
        )}
      </div>
    )
  }
}
