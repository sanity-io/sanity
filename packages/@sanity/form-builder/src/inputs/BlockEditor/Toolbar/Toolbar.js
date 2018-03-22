// @flow
import type {BlockContentFeatures, SlateValue, SlateChange} from '../typeDefs'

import React from 'react'

import AnnotationButtons from './AnnotationButtons'
import BlockStyleSelect from './BlockStyleSelect'
import BlockObjectsMenu from './BlockObjectsMenu'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import DecoratorButtons from './DecoratorButtons'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import ListItemButtons from './ListItemButtons'

import styles from './styles/Toolbar.css'

type Props = {
  blockContentFeatures: BlockContentFeatures,
  editorValue: SlateValue,
  focusPath: [],
  fullscreen: boolean,
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  onToggleFullScreen: void => void
}

export default class Toolbar extends React.PureComponent<Props> {
  render() {
    const {
      blockContentFeatures,
      fullscreen,
      editorValue,
      onChange,
      onFocus,
      onToggleFullScreen
    } = this.props
    const className = `${styles.root}${fullscreen ? ` ${styles.fullscreen}` : ''}`

    return (
      <div className={className}>
        <div className={styles.blockFormatContainer}>
          <BlockStyleSelect
            editorValue={editorValue}
            onChange={onChange}
            blockContentFeatures={blockContentFeatures}
          />
        </div>

        <div className={styles.canBeMinimized}>
          <div className={styles.formatButtonsContainer}>
            {blockContentFeatures.decorators.length > 0 && (
              <div className={styles.decoratorButtonsContainer}>
                <DecoratorButtons
                  editorValue={editorValue}
                  onChange={onChange}
                  blockContentFeatures={blockContentFeatures}
                />
              </div>
            )}

            {blockContentFeatures.lists.length > 0 && (
              <div className={styles.decoratorButtonsContainer}>
                <ListItemButtons
                  editorValue={editorValue}
                  onChange={onChange}
                  blockContentFeatures={blockContentFeatures}
                />
              </div>
            )}
          </div>

          {blockContentFeatures.annotations.length > 0 && (
            <div className={styles.annotationButtonsContainer}>
              <AnnotationButtons
                editorValue={editorValue}
                onChange={onChange}
                blockContentFeatures={blockContentFeatures}
              />
            </div>
          )}
        </div>

        {blockContentFeatures.blockObjectTypes.length > 0 && (
          <div className={styles.insertContainer}>
            <BlockObjectsMenu
              types={blockContentFeatures.blockObjectTypes}
              editorValue={editorValue}
              onChange={onChange}
              onFocus={onFocus}
            />
          </div>
        )}

        <div className={styles.fullscreenButtonContainer}>
          <Button
            kind="simple"
            onClick={onToggleFullScreen}
            icon={fullscreen ? CloseIcon : FullscreenIcon}
          />
        </div>
      </div>
    )
  }
}
