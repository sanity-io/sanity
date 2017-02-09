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
    hasUnAcceptedFiles: false,
    toManyFiles: false
  }

  handleDragOver = event => {

    const {accept} = this.props

    // Todo handle image/*
    if (!accept || accept == 'image/*') {
      this.setState({
        hasUnAcceptedFiles: false
      })
      return
    }

    const items = get(event, 'nativeEvent.dataTransfer.items')

    const mimeTypes = this.props.accept.split(',') || []

    if (items) {
      if (items.length > 1 && !this.props.multiple) {
        this.setState({
          toManyFiles: true
        })
        return
      }

      for (let i = 0; i < items.length; i++) {
        this.setState({
          hasUnAcceptedFiles: !includes(mimeTypes, items[i].type)
        })
      }
    }
  }

  resetErrorState = () => {
    this.setState({
      hasUnAcceptedFiles: false,
      toManyFiles: false
    })
  }

  handleDragEnd = event => {
    this.resetErrorState()
  }


  render() {

    const {className, multiple, icon, ghost, accept, ...rest} = this.props
    const {hasUnAcceptedFiles, toManyFiles} = this.state

    const Icon = icon

    return (
      <DropZone
        {...rest}
        className={`
          ${className ? className : ''}
          ${ghost ? styles.ghost : styles.dropZone}
          ${(hasUnAcceptedFiles || toManyFiles) ? styles.hasError : ''}
        `}
        activeClassName={`${ghost ? styles.activeGhost : styles.activeDropZone}`}
        onDragOver={this.handleDragOver}
        onDragEnd={this.handleDragEnd}
        onDragExit={this.handleDragEnd}
        onDragLeave={this.handleDragEnd}
        onMouseOver={this.handleDragEnd}
      >
        <div className={styles.inner}>
          {
            hasUnAcceptedFiles && !toManyFiles && (
              <p className={styles.errorText}>
                Accepted file formats: {accept}
              </p>
            )
          }
          {
            toManyFiles && (
              <p className={styles.errorText}>
                Only one image allowed
              </p>
            )
          }
          <div className={styles.passiveText}>
            <div className={styles.iconContainer}>
              {Icon && <Icon />}
            </div>
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
