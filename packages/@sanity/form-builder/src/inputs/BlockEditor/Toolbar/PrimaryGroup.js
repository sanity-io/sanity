// @flow

/* eslint-disable complexity */

import React from 'react'
import type {BlockContentFeatures, SlateValue, Path, SlateEditor, Type} from '../typeDefs'

import AnnotationButtons from './AnnotationButtons'
import BlockStyleSelect from './BlockStyleSelect'
import DecoratorButtons from './DecoratorButtons'
import InsertMenu from './InsertMenu'
import ListItemButtons from './ListItemButtons'

import styles from './styles/PrimaryGroup.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editor: SlateEditor,
  editorValue: SlateValue,
  onFocus: Path => void,
  style: {},
  type: Type,
  userIsWritingText: boolean,
  collapsedGroups: array,
  insertItems: array,
  isPopped: boolean,
  isMobile: boolean
}

type State = {
  collapsePrimaryIsOpen: boolean,
  showValidationTooltip: boolean,
  collapsePrimary: boolean,
  isMobile: boolean,
  lastContentWidth: number
}

export default class PrimaryGroup extends React.PureComponent<Props, State> {
  render() {
    const {
      blockContentFeatures,
      editor,
      editorValue,
      onFocus,
      type,
      userIsWritingText,
      collapsedGroups,
      insertItems,
      isMobile,
      isPopped
    } = this.props

    if (!editor) {
      return null
    }
    return (
      <div className={isPopped ? styles.isPopped : styles.root}>
        <div className={styles.blockStyleGroup}>
          <BlockStyleSelect
            className={styles.blockStyleSelect}
            blockContentFeatures={blockContentFeatures}
            editor={editor}
            editorValue={editorValue}
          />
        </div>
        {blockContentFeatures.decorators.length > 0 && (
          <div className={styles.group}>
            <DecoratorButtons
              collapsed={collapsedGroups.indexOf('decoratorButtons') >= 0}
              blockContentFeatures={blockContentFeatures}
              editor={editor}
              editorValue={editorValue}
            />
          </div>
        )}
        {blockContentFeatures.lists.length > 0 && (
          <div className={styles.group}>
            <ListItemButtons
              collapsed={collapsedGroups.indexOf('listItemButtons') >= 0}
              blockContentFeatures={blockContentFeatures}
              editor={editor}
              editorValue={editorValue}
            />
          </div>
        )}
        {blockContentFeatures.annotations.length > 0 && (
          <div className={styles.group}>
            <AnnotationButtons
              collapsed={collapsedGroups.indexOf('annotationButtons') >= 0}
              blockContentFeatures={blockContentFeatures}
              editor={editor}
              editorValue={editorValue}
              onFocus={onFocus}
              userIsWritingText={userIsWritingText}
            />
          </div>
        )}
        {insertItems.length > 0 && (
          <div className={styles.group}>
            <InsertMenu
              collapsed={isMobile || collapsedGroups.indexOf('insertMenu') >= 0}
              showLabels={
                blockContentFeatures.types.blockObjects.concat(
                  blockContentFeatures.types.inlineObjects
                ).length < 4
              }
              blockTypes={blockContentFeatures.types.blockObjects}
              editor={editor}
              editorValue={editorValue}
              inlineTypes={blockContentFeatures.types.inlineObjects}
              onFocus={onFocus}
              type={type}
            />
          </div>
        )}
      </div>
    )
  }
}
