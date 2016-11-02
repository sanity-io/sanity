import React, {PropTypes} from 'react'
import StyleSelect from 'part:@sanity/components/selects/style'
import styles from './styles/BlockFormat.css'

export const blockFormatShape = PropTypes.shape({
  key: PropTypes.string,
  multiple: PropTypes.bool,
  active: PropTypes.bool,
  title: PropTypes.string,
  preview: PropTypes.node,
  field: PropTypes.object
})

export default class BlockFormat extends React.Component {

  static propTypes = {
    value: PropTypes.arrayOf(blockFormatShape),
    items: PropTypes.arrayOf(blockFormatShape),
    onSelect: PropTypes.func
  }

  renderItem = item => {
    return (
      <div>
        {item.preview}
      </div>
    )
  }

  render() {
    if (!this.props.items || this.props.items.length === 0) {
      return null
    }
    return (
      <StyleSelect
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
