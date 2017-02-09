import React, {PropTypes} from 'react'
import DropZone from 'react-dropzone'
import {get} from 'lodash'
import accepts from 'attr-accept'
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

    const {className, multiple, icon, ghost, accept, ...rest} = this.props
    const {acceptsSelectedFiles, tooManyFiles} = this.state

    const Icon = icon

    return (
      <DropZone
        {...rest}
        className={`
          ${className ? className : ''}
          ${ghost ? styles.ghost : styles.dropZone}
          ${(!acceptsSelectedFiles || tooManyFiles) ? styles.hasError : ''}
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
            !acceptsSelectedFiles && !tooManyFiles && (
              <p className={styles.errorText}>
                Accepted file formats: {accept}
              </p>
            )
          }
          {
            tooManyFiles && (
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
              acceptsSelectedFiles && (
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
              acceptsSelectedFiles && (
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
