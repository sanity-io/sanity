import React, {PropTypes} from 'react'
import styles from './styles/Toolbar.css'
import InsertDropdown from './InsertDropdown'
import TextFormatToolbar from './TextFormat'
import ListFormat from './ListFormat'
import BlockFormat from './BlockFormat'
import Button from 'part:@sanity/components/buttons/default'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import CloseIcon from 'part:@sanity/base/close-icon'

export default class Toolbar extends React.Component {

  static propTypes = {
    onInsertBlock: PropTypes.func,
    onFullscreenEnable: PropTypes.func,
    className: PropTypes.string,
    fullscreen: PropTypes.bool,
    onMarkButtonClick: PropTypes.func,
    onListButtonClick: PropTypes.func,
    onFormatSelectChange: PropTypes.func,
    insertBlocks: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        title: PropTypes.title
      })
    ),
    marks: PropTypes.arrayOf(
      PropTypes.shape({
        active: PropTypes.bool,
        type: PropTypes.string
      })),
    listFormats: PropTypes.arrayOf(
      PropTypes.shape({
        active: PropTypes.bool,
        type: PropTypes.string,
        title: PropTypes.string,
      })
    ),
    textFormats: PropTypes.shape({
      value: PropTypes.shape({
        key: PropTypes.string,
        multiple: PropTypes.bool,
        active: PropTypes.bool,
        title: PropTypes.string,
        preview: PropTypes.node,
        field: PropTypes.object
      }),
      items: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string,
          multiple: PropTypes.bool,
          active: PropTypes.bool,
          title: PropTypes.string,
          preview: PropTypes.node,
          field: PropTypes.object
        })
      )
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.marks !== nextProps.marks
      || this.props.fullscreen !== nextProps.fullscreen
    ) {
      return true
    }
    return false
  }

  render() {
    const {
      className,
      fullscreen,
      marks,
      onMarkButtonClick,
      onListButtonClick,
      onFormatSelectChange,
      listFormats,
      textFormats,
      insertBlocks
    } = this.props

    return (
      <div className={`${styles.root} ${className}`}>
        <div className={styles.blockFormatContainer}>
          <BlockFormat value={textFormats.value} items={textFormats.items} onSelect={onFormatSelectChange} />
        </div>
        <div className={styles.textFormatContainer}>
          <TextFormatToolbar marks={marks} onClick={onMarkButtonClick} />
        </div>
        <div className={styles.listFormatContainer}>
          <ListFormat listFormats={listFormats} onClick={onListButtonClick} />
        </div>
        <div className={styles.fullscreenButtonContainer}>
          <Button
            kind="simple"
            onClick={this.props.onFullscreenEnable}
            icon={fullscreen ? CloseIcon : FullscreenIcon}
          />
        </div>
        <div className={styles.insertContainer}>
          <InsertDropdown blocks={insertBlocks} onInsertBlock={this.props.onInsertBlock} />
        </div>
      </div>
    )
  }
}
