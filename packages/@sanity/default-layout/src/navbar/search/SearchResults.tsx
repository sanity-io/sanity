import Spinner from 'part:@sanity/components/loading/spinner'
import React from 'react'
import {ResultItem} from './types'

import styles from './SearchResults.css'

interface Props {
  activeIndex: number
  error?: {message: string}
  isBleeding: boolean
  isLoading: boolean
  items: ResultItem[]
  query: string
  renderItem: (item: ResultItem, index: number, className: string) => React.ReactNode
}

class SearchResults extends React.PureComponent<Props> {
  static defaultProps = {
    error: null,
  }

  element: HTMLElement | null = null

  setElement = (ref: HTMLElement) => {
    this.element = ref
  }

  // NOTE: Disabled because `{block: 'nearest'}` is not supported by all browsers
  // // eslint-disable-next-line class-methods-use-this
  // componentDidUpdate(prevProps: Props) {
  //   const {isBleeding} = this.props

  //   // Scroll active element into view (when user uses arrow keys)
  //   if (!isBleeding && this.element && prevProps.activeIndex !== this.props.activeIndex) {
  //     const activeItemElement = this.element.childNodes[this.props.activeIndex]

  //     if (activeItemElement) {
  //       // Use try/catch to avoid crashing unsupported browsers
  //       // eslint-disable-next-line max-depth
  //       try {
  //         activeItemElement.scrollIntoView({block: 'nearest'})
  //       } catch (__) {
  //         // ignore
  //       }
  //     }
  //   }
  // }

  render() {
    const {activeIndex, error, isLoading, items, query, renderItem} = this.props
    const noResults = !isLoading && query.length > 0 && items.length === 0
    if (error) {
      return <div className={`${styles.root} ${styles.noResults}`}>{error.message}</div>
    }

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
          return (
            <li key={item.hit._id} className={styles.listItem}>
              {renderItem(item, index, activeIndex === index ? styles.activeItem : styles.item)}
            </li>
          )
        })}
      </ul>
    )
  }
}

export default SearchResults
