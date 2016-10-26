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
    children: PropTypes.node,
    groupedFields: PropTypes.object,
    onInsertBlock: PropTypes.func,
    value: PropTypes.object,
    onChange: PropTypes.func,
    slateSchema: PropTypes.object,
    onFullscreenEnable: PropTypes.func,
    className: PropTypes.string
  }

  render() {
    const {
      groupedFields,
      value,
      onChange,
      slateSchema,
      className,
      fullscreen
    } = this.props
    return (
      <div className={`${styles.root} ${className}`}>
        <div className={styles.blockFormatContainer}>
          <BlockFormat groupedFields={groupedFields} value={value} slateSchema={slateSchema} onChange={onChange} />
        </div>
        <div className={styles.textFormatContainer}>
          <TextFormatToolbar value={value} groupedFields={groupedFields} onChange={onChange} />
        </div>
        <div className={styles.listFormatContainer}>
          <ListFormat groupedFields={groupedFields} slateSchema={slateSchema} value={value} onChange={onChange} />
        </div>
        <div className={styles.fullscreenButtonContainer}>
          <Button
            kind="simple"
            onClick={this.props.onFullscreenEnable}
            icon={fullscreen ? CloseIcon : FullscreenIcon}
          />
        </div>
        <div className={styles.insertContainer}>
          <InsertDropdown groupedFields={groupedFields} onInsertBlock={this.props.onInsertBlock} />
        </div>
      </div>
    )
  }
}
