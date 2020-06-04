/* eslint-disable complexity */

import classNames from 'classnames'
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
  HotkeyOptions,
  RenderBlockFunction
} from '@sanity/portable-text-editor'
import {getBlockStyleSelectProps} from './helpers'

type Props = {
  editor: PortableTextEditor
  hotkeys: HotkeyOptions
  insertItems: Type[]
  isFullscreen: boolean
  isMobile?: boolean
  isPopped?: boolean
  isReadOnly: boolean
  onFocus: (path: Path) => void
  renderBlock: RenderBlockFunction
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
      editor,
      insertItems,
      isFullscreen,
      isMobile,
      isPopped,
      isReadOnly,
      onFocus,
      selection
    } = this.props
    if (!editor) {
      return null
    }
    const portableTextFeatures = PortableTextEditor.getPortableTextFeatures(editor)

    const blockStyleSelectProps = {
      ...getBlockStyleSelectProps(editor)
    }

    const className = classNames(
      isPopped ? styles.isPopped : styles.root,
      isFullscreen && styles.fullscreen
    )

    return (
      <div className={className}>
        {/* Show block style selection if there are 2 or more styles */}
        {blockStyleSelectProps.items.length > 1 && (
          <div className={styles.blockStyleGroup}>
            {!isReadOnly && (
              <BlockStyleSelect
                {...blockStyleSelectProps}
                className={styles.blockStyleSelect}
                editor={editor}
                padding="small"
                selection={this.props.selection}
                renderBlock={this.props.renderBlock}
              />
            )}
          </div>
        )}

        {portableTextFeatures.decorators.length > 0 && (
          <div className={styles.group}>
            {!isReadOnly && (
              <DecoratorButtons
                editor={editor}
                hotkeys={this.props.hotkeys}
                selection={selection}
              />
            )}
          </div>
        )}

        {portableTextFeatures.lists.length > 0 && (
          <div className={styles.group}>
            {!isReadOnly && <ListItemButtons editor={editor} selection={this.props.selection} />}
          </div>
        )}

        {portableTextFeatures.annotations.length > 0 && (
          <div className={styles.group}>
            {!isReadOnly && (
              <AnnotationButtons
                editor={editor}
                onFocus={onFocus}
                selection={this.props.selection}
              />
            )}
          </div>
        )}

        {insertItems.length > 0 && (
          <div className={styles.group}>
            {!isReadOnly && (
              <InsertMenu
                editor={editor}
                onFocus={onFocus}
                selection={selection}
                showLabels={
                  portableTextFeatures.types.blockObjects.concat(
                    portableTextFeatures.types.inlineObjects
                  ).length < 4
                }
              />
            )}
          </div>
        )}
      </div>
    )
  }
}
