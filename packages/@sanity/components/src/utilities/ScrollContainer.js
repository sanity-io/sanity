import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/ScrollContainer.css'

export default class ScrollContainer extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    onScroll: PropTypes.func
  }

  static defaultProps = {
    onScroll: () => {}
  }

  getChildContext() {
    return {
      getScrollContainer: () => this._scrollContainerElement
    }
  }

  static defaultProps = {
    className: ''
  }

  componentDidMount() {
    this._scrollContainerElement.addEventListener('scroll', this.props.onScroll, {passive: true})
  }

  componentWillUnmount() {
    this._scrollContainerElement.removeEventListener('scroll', this.props.onScroll, {passive: true})
  }

  static childContextTypes = {
    getScrollContainer: PropTypes.func
  }

  setScrollContainerElement = element => {
    this._scrollContainerElement = element
  }

  render() {
    return (
      <div
        ref={this.setScrollContainerElement}
        className={`${styles.scrollContainer} ${this.props.className}`}
      >
        {this.props.children}
      </div>
    )
  }
}
