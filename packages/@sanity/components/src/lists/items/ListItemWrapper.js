import React, {PropTypes} from 'react'
// import styles from 'part:@sanity/components/lists/items/default-style'
import listStyles from './styles/ListItemWrapper.css'
import gridStyles from './styles/GridItemWrapper.css'

import classNames from 'classnames'

function shouldItemBeInView(props) {
  return props.selected || props.highlighted
}

/**
ListItemWrapper implements common behavior for all list items and deals with:
  - ensuring item is visible (by calling a provided `scrollIntoView`)
  - rendering correct classes
*/
export default class ListItemWrapper extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    selected: PropTypes.bool,
    highlighted: PropTypes.bool,
    scrollIntoView: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
    decoration: PropTypes.oneOf(['default', 'zebra-stripes', 'divider']),
    layout: PropTypes.oneOf(['list', 'grid'])
  }

  static defaultProps = {
    onSelect() {},
    decoration: 'default',
    layout: 'list'
  }

  componentDidMount() {
    // TODO fix this
    // Hack because the ref in defaultlist is called after this
    setTimeout(() => this.ensureVisible(this.props), 0)
  }

  componentDidUpdate(prevProps) {
    const wasInView = shouldItemBeInView(prevProps)
    const shouldBeInView = shouldItemBeInView(this.props)
    if (!wasInView && shouldBeInView) {
      // Only scrollIntoView when needed
      this.ensureVisible(this.props)
    }
  }

  ensureVisible(props) {
    const {selected, scrollIntoView, highlighted} = props
    if ((selected || highlighted) && scrollIntoView) {
      scrollIntoView(this._element)
    }
  }

  setElement = element => {
    this._element = element
  }

  render() {
    const {selected, highlighted, className, decoration, children, layout} = this.props

    const styles = layout === 'grid' ? gridStyles : listStyles

    const rootClasses = classNames([
      styles.root,
      decoration && styles[decoration],
      highlighted && styles.highlighted,
      selected && styles.selected,
      className
    ])

    return (
      <li className={rootClasses} ref={this.setElement}>
        {children}
      </li>
    )
  }
}
