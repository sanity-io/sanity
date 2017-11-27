import PropTypes from 'prop-types'
import React from 'react'
import {get} from 'lodash'
import styles from './styles/DropZone.css'

export default class DropZone extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    multiple: PropTypes.bool,
    accept: PropTypes.string
  }

  static defaultProps = {
    multiple: true
  }

  state = {
    acceptsSelectedFiles: true,
    tooManyFiles: false
  }

  handleDragOver = event => {

    const {accept} = this.props

    if (!accept) {
      this.setState({
        acceptsSelectedFiles: true
      })
      return
    }

    const items = get(event, 'nativeEvent.dataTransfer.items')

    if (items) {
      if (items.length > 1 && !this.props.multiple) {
        this.setState({
          tooManyFiles: true
        })
        return
      }

      this.setState({
        acceptsSelectedFiles: Array.from(items).every(item => accepts(item, accept))
      })
    }
  }

  resetErrorState = () => {
    this.setState({
      acceptsSelectedFiles: true,
      tooManyFiles: false
    })
  }

  handleDragEnd = event => {
    this.resetErrorState()
  }

  render() {
    const {className, children} = this.props
    const classNames = [className, styles.dropZone].filter(Boolean).join(' ')
    return (
      <div
        className={classNames}
        tabIndex="0"
        onPaste={this.handlePaste} /* note: the onPaste must be on fieldset for it to work in chrome */
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
      >
        {children}
        <div className={styles.overlay} />
      </div>
    )
  }
}
