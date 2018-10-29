import Spinner from 'part:@sanity/components/loading/spinner'
import PropTypes from 'prop-types'
import React from 'react'

import styles from './styles/SearchResults.css'

class SearchResults extends React.PureComponent {
  static propTypes = {
    activeIndex: PropTypes.number.isRequired,
    isLoading: PropTypes.bool.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired
      })
    ).isRequired,
    query: PropTypes.string.isRequired,
    renderItem: PropTypes.func.isRequired
  }

  element = null

  setElement = ref => {
    this.element = ref
  }

  render() {
    const {activeIndex, isLoading, items, query, renderItem} = this.props
    const noResults = !isLoading && query.length > 0 && items.length === 0

    if (noResults) {
      return (
        <div className={`${styles.root} ${styles.noResults}`}>
          <div>
            Could not find{' '}
            <strong>
              &ldquo;
              {query}
              &rdquo;
            </strong>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className={`${styles.root} ${styles.isLoading}`}>
          <Spinner center message={'Searching…'} />
        </div>
      )
    }

    return (
      <ul className={styles.root} ref={this.setElement}>
        {items.map((item, index) => {
          let className = styles.item
          if (activeIndex === index) className += ` ${styles.activeItem}`
          return (
            <li key={item._id} className={className}>
              {renderItem(item, index, styles.link)}
            </li>
          )
        })}
      </ul>
    )
  }
}

export default SearchResults
