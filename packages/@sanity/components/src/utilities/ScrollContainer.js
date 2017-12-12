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
    this._scrollContainerElement.addEventListener('scroll', this.handleScroll, {passive: true})
  }

  componentWillUnmount() {
    this._scrollContainerElement.removeEventListener('scroll', this.handleScroll, {passive: true})
  }

  static childContextTypes = {
    getScrollContainer: PropTypes.func
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
        className={this.props.className || styles.scrollContainer}
      >
        {this.props.children}
      </div>
    )
  }
}
