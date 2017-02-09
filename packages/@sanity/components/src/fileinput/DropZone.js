import React, {PropTypes} from 'react'
import DropZone from 'react-dropzone'
import {get, includes} from 'lodash'

import styles from 'part:@sanity/components/fileinput/dropzone-style'

export default class Dropzone extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    multiple: PropTypes.bool,
    icon: PropTypes.func,
    ghost: PropTypes.bool,
    accept: PropTypes.string
  }

  static defaultProps = {
    multiple: true
  }

  state = {
    hasUnAcceptedFiles: false
  }

  handleDragOver = event => {

    const {accept} = this.props

    if (!accept) {
      return
    }

    const items = get(event, 'nativeEvent.dataTransfer.items')

    const mimeTypes = this.props.accept.split(',') || []

    if (items) {
      for (let i = 0; i < items.length; i++) {
        // Todo: support image/* etc.
        this.setState({
          hasUnAcceptedFiles: !includes(mimeTypes, items[i].type)
        })
      }
    }
  }

  handleDragEnd = event => {
    this.setState({
      hasUnAcceptedFiles: false
    })
  }


  render() {

    const {className, multiple, icon, ghost, accept} = this.props
    const {hasUnAcceptedFiles} = this.state

    const Icon = icon

    return (
      <DropZone
        {...this.props}
        className={`
          ${className ? className : ''}
          ${ghost ? styles.ghost : styles.dropZone}
          ${hasUnAcceptedFiles ? styles.hasUnAcceptedFiles : ''}
        `}
        activeClassName={`${ghost ? styles.activeGhost : styles.activeDropZone}`}
        onDragOver={this.handleDragOver}
        onDragEnd={this.handleDragEnd}
        onDragExit={this.handleDragEnd}
        onDragLeave={this.handleDragEnd}
      >
        <div className={styles.inner}>
          <div className={styles.passiveText}>
            <div className={styles.iconContainer}>
              {Icon && <Icon />}
            </div>
            {
              hasUnAcceptedFiles && (
                <p className={styles.errorText}>
                  Accepted file formats
                  <pre>
                    {accept}
                  </pre>
                </p>
              )
            }
            {
              !hasUnAcceptedFiles && (
                <div>
                  <p className={styles.strong}>
                    {
                      multiple ? <span>Select files</span> : <span>Select file</span>
                    }
                  </p>
                  <p className={styles.light}>
                    {
                      multiple ? <span>…or drop them here</span> : <span>…or drop it here</span>
                    }
                  </p>
                </div>
              )
            }
          </div>

          <div className={styles.activeText}>
            <div className={styles.iconContainer}>
              {Icon && <Icon />}
            </div>
            {
              !hasUnAcceptedFiles && (
                <p className={styles.strong}>
                  {
                    multiple ? <span>Drop files…</span> : <span>Drop file…</span>
                  }
                </p>
              )
            }
          </div>
        </div>
      </DropZone>
    )
  }
}
