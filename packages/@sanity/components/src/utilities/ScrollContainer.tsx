import PropTypes from 'prop-types'
import React from 'react'

import styles from './ScrollContainer.css'

interface ScrollContainerProps extends Omit<React.HTMLProps<HTMLDivElement>, 'onScroll'> {
  onScroll?: (event: Event) => void
}

// @todo: refactor to functional component
export default class ScrollContainer extends React.PureComponent<ScrollContainerProps> {
  _scrollContainerElement: HTMLDivElement | null = null

  getChildContext() {
    return {
      getScrollContainer: () => this._scrollContainerElement
    }
  }

  static childContextTypes = {
    getScrollContainer: PropTypes.func
  }

  componentDidMount() {
    const {onScroll} = this.props

    if (onScroll && this._scrollContainerElement) {
      this._scrollContainerElement.addEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillUnmount() {
    const {onScroll} = this.props

    if (onScroll && this._scrollContainerElement) {
      this._scrollContainerElement.removeEventListener('scroll', this.handleScroll)
    }
  }

  handleScroll = (event: Event) => {
    const {onScroll} = this.props

    if (onScroll) onScroll(event)
  }

  setScrollContainerElement = (element: HTMLDivElement | null) => {
    this._scrollContainerElement = element
  }

  render() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {children, className, onScroll: _, ...restProps} = this.props

    return (
      <div
        {...restProps}
        className={`${styles.scrollContainer} ${className}`}
        ref={this.setScrollContainerElement}
      >
        {children}
      </div>
    )
  }
}
