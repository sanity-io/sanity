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
    className: '',
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

  static childContextTypes = {
    getScrollContainer: PropTypes.func
  }

  componentDidMount() {
    if (this.props.onScroll) {
      this._scrollContainerElement.addEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  componentWillUnmount() {
    if (this.props.onScroll) {
      this._scrollContainerElement.removeEventListener('scroll', this.handleScroll, {passive: true})
    }
  }

  handleScroll = event => {
    this.props.onScroll(event)
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
