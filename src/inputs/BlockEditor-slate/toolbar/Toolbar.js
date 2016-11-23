import React, {PropTypes} from 'react'
import styles from './styles/Toolbar.css'
import InsertDropdown, {insertBlockShape} from './InsertDropdown'
import TextFormatToolbar, {textFormatShape} from './TextFormat'
import ListFormat, {listFormatShape} from './ListFormat'
import BlockFormat, {blockFormatShape} from './BlockFormat'
import Button from 'part:@sanity/components/buttons/default'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import LinkButton from './LinkButton'

export default class Toolbar extends React.Component {

  static propTypes = {
    onInsertBlock: PropTypes.func,
    onFullscreenEnable: PropTypes.func,
    className: PropTypes.string,
    fullscreen: PropTypes.bool,
    onMarkButtonClick: PropTypes.func,
    onLinkButtonClick: PropTypes.func,
    onListButtonClick: PropTypes.func,
    onFormatSelectChange: PropTypes.func,
    insertBlocks: PropTypes.arrayOf(insertBlockShape),
    marks: PropTypes.arrayOf(
      textFormatShape
    ),
    listFormats: PropTypes.arrayOf(
      listFormatShape
    ),
    textFormats: PropTypes.shape({
      value: PropTypes.arrayOf(blockFormatShape),
      items: PropTypes.arrayOf(blockFormatShape),
      onSelect: PropTypes.func
    }),
    activeLink: PropTypes.shape({
      href: PropTypes.string,
      target: PropTypes.string
    }),
    showLinkButton: PropTypes.bool
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
      insertBlocks,
      onLinkButtonClick,
      activeLink,
      showLinkButton
    } = this.props

    return (
      <div className={`${styles.root} ${className}`}>
        <div className={styles.blockFormatContainer}>
          <BlockFormat value={textFormats.value} items={textFormats.items} onSelect={onFormatSelectChange} />
        </div>

        {marks && marks.length > 0 && (
          <div className={styles.textFormatContainer}>
            <TextFormatToolbar marks={marks} onClick={onMarkButtonClick} />
          </div>
        )}

        {listFormats && listFormats.length > 0 && (
          <div className={styles.listFormatContainer}>
            <ListFormat listFormats={listFormats} onClick={onListButtonClick} />
          </div>
        )}

        {
          showLinkButton && (
            <div className={styles.linkContainer}>
              <LinkButton activeLink={activeLink} onClick={onLinkButtonClick} />
            </div>
          )
        }

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
