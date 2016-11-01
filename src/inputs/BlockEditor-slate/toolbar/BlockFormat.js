import React, {PropTypes} from 'react'
import blockFormattingSelectStyles from './styles/BlockFormattingSelect.css'
import styles from './styles/BlockFormat.css'

import CustomSelect from 'part:@sanity/components/selects/custom'

export default class BlockFormat extends React.Component {

  static propTypes = {
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
    ),
    onSelect: PropTypes.func
  }

  renderItem = item => {
    return (
      <div className={`${blockFormattingSelectStyles.listItem} ${item.disabled && blockFormattingSelectStyles.disabled}`}>
        <div className={blockFormattingSelectStyles.statusIndicator}>
          {item.active
            && <span dangerouslySetInnerHTML={{__html: '&#10003;'}} />}
          {item.multiple
            && <span dangerouslySetInnerHTML={{__html: '&ndash;'}} />}
          {!item.multiple && !item.active
            && <span dangerouslySetInnerHTML={{__html: '&nbsp;'}} />}
        </div>
        <div className={blockFormattingSelectStyles.preview}>
          {item.preview}
        </div>
      </div>
    )
  }

  render() {
    if (!this.props.items || this.props.items.length === 0) {
      return null
    }
    return (
      <CustomSelect
        className={styles.root}
        label="Text"
        items={this.props.items}
        value={this.props.value}
        onChange={this.props.onSelect}
        renderItem={this.renderItem}
        transparent
      />
    )
  }
}
