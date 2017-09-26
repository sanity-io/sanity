import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Toolbar.css'
import InsertBlocks, {insertBlockShape} from './InsertBlocks'
import Decorators, {decorator} from './Decorators'
import ListItems, {listItem} from './ListItems'
import BlockStyle, {blockStyleShape} from './BlockStyle'
import Button from 'part:@sanity/components/buttons/default'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import AnnotationButton from './AnnotationButton'

export default class Toolbar extends React.Component {

  static propTypes = {

    className: PropTypes.string,
    style: PropTypes.object,

    fullscreen: PropTypes.bool,

    blockStyles: PropTypes.shape({
      value: PropTypes.arrayOf(blockStyleShape),
      items: PropTypes.arrayOf(blockStyleShape),
      onSelect: PropTypes.func
    }),

    annotations: PropTypes.arrayOf(PropTypes.object),
    decorators: PropTypes.arrayOf(decorator),
    insertBlocks: PropTypes.arrayOf(insertBlockShape),
    listItems: PropTypes.arrayOf(
      listItem
    ),

    onInsertBlock: PropTypes.func,
    onFullscreenEnable: PropTypes.func,
    onMarkButtonClick: PropTypes.func,
    onListButtonClick: PropTypes.func,
    onBlockStyleChange: PropTypes.func,
    onAnnotationButtonClick: PropTypes.func
  };

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.decorators !== nextProps.decorators
      || this.props.blockStyles !== nextProps.blockStyles
      || this.props.fullscreen !== nextProps.fullscreen
      || this.props.annotations !== nextProps.annotations
    )
  }

  render() {
    const {
      className,
      fullscreen,
      annotations,
      decorators,
      listItems,
      blockStyles,
      insertBlocks,
      onInsertBlock,
      onMarkButtonClick,
      onListButtonClick,
      onBlockStyleChange,
      onAnnotationButtonClick,
      style
    } = this.props

    return (
      <div className={`${styles.root} ${className}`} style={style}>
        <div className={styles.blockFormatContainer}>
          <BlockStyle value={blockStyles.value} items={blockStyles.items} onSelect={onBlockStyleChange} />
        </div>

        <div className={styles.canBeMinimized}>

          <div className={styles.formatButtons}>
            {decorators && decorators.length > 0 && (
              <div className={styles.decoratorContainer}>
                <Decorators decorators={decorators} onClick={onMarkButtonClick} />
              </div>
            )}

            {listItems && listItems.length > 0 && (
              <div className={styles.listFormatContainer}>
                <ListItems listItems={listItems} onClick={onListButtonClick} />
              </div>
            )}
          </div>

          {annotations && annotations.length > 0 && (
            <div className={styles.annotationsContainer}>
              {
                annotations.map(annotation => {
                  return (
                    <AnnotationButton
                      key={`annotationButton${annotation.type.name}`}
                      annotation={annotation} onClick={onAnnotationButtonClick}
                    />
                  )
                })
              }
            </div>
          )}
        </div>

        {insertBlocks.length > 0 && (
          <div className={styles.insertContainer}>
            <InsertBlocks blocks={insertBlocks} onInsertBlock={onInsertBlock} />
          </div>
        )}

        <div className={styles.fullscreenButtonContainer}>
          <Button
            kind="simple"
            onClick={this.props.onFullscreenEnable}
            icon={fullscreen ? CloseIcon : FullscreenIcon}
          />
        </div>
      </div>
    )
  }
}
