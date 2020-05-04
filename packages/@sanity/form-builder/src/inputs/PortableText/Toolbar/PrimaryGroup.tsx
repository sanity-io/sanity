/* eslint-disable complexity */
import React from 'react'
// import AnnotationButtons from './AnnotationButtons'
import BlockStyleSelect from './BlockStyleSelect'
import DecoratorButtons from './DecoratorButtons'
import InsertMenu from './InsertMenu'
import ListItemButtons from './ListItemButtons'
import styles from './PrimaryGroup.css'
import {Path} from '../../../typedefs/path'
import {PortableTextEditor, EditorSelection, Type} from '@sanity/portable-text-editor'

type Props = {
  collapsedGroups: string[]
  editor: PortableTextEditor
  selection: EditorSelection
  onFocus: (path: Path) => void
  insertItems: Type[]
  isPopped?: boolean
  isMobile?: boolean
}
type State = {
  collapsePrimaryIsOpen: boolean
  showValidationTooltip: boolean
  collapsePrimary: boolean
  isMobile: boolean
  lastContentWidth: number
}
export default class PrimaryGroup extends React.PureComponent<Props, State> {
  static defaultProps = {
    isPopped: false,
    isMobile: false
  }

  render() {
    const {
      editor,
      onFocus,
      collapsedGroups,
      insertItems,
      isMobile,
      isPopped,
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
              selection={selection}
            />
          </div>
        )}
        {portableTextFeatures.lists.length > 0 && (
          <div className={styles.group}>
            <ListItemButtons
              selection={this.props.selection}
              collapsed={collapsedGroups.indexOf('listItemButtons') >= 0}
              editor={editor}
            />
          </div>
        )}
        {portableTextFeatures.annotations.length > 0 && (
          <div className={styles.group}>
            {/* <AnnotationButtons
              collapsed={collapsedGroups.indexOf('annotationButtons') >= 0}
              portableTextFeatures={portableTextFeatures}
              editor={editor}
              onFocus={onFocus}
              isThrottling={isThrottling}
            /> */}
          </div>
        )}
        {insertItems.length > 0 && (
          <div className={styles.group}>
            <InsertMenu
              collapsed={isMobile || collapsedGroups.indexOf('insertMenu') >= 0}
              showLabels={
                portableTextFeatures.types.blockObjects.concat(
                  portableTextFeatures.types.inlineObjects
                ).length < 4
              }
              editor={editor}
              onFocus={onFocus}
            />
          </div>
        )}
      </div>
    )
  }
}
