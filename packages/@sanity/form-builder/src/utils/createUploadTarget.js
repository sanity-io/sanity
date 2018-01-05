// @flow
import React from 'react'
import type {Path} from '../typedefs/path'
import {sortBy} from 'lodash'

import type {Uploader} from '../sanity/uploads/typedefs'
import type {Type} from '../typedefs'

import Snackbar from 'part:@sanity/components/snackbar/default'
import Button from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import styles from '../styles/UploadTarget.css'
import humanize from 'humanize-list'

type Props = {
  type: Type,
  children: () => {},
  className?: string,
  onFocus: ?(Path => void),
  getUploadOptions: (type: Type, file: File) => UploadOption,
  onUpload?: (type: Type, file: File) => Uploader
}

type UploadTask = {
  file: File,
  uploaderCandidates: Array<UploadOption>
}

type State = {
  rejected: Array<UploadTask>,
  ambiguous: Array<UploadTask>,
  isMoving: ?boolean
}

export function createUploadTarget(Component) {
  return class UploadTargetFieldset extends React.Component<Props, State> {
    _element: ?typeof Component
    dragEnteredEls: Array<Element> = []

    static defaultProps = {
      tabIndex: 0
    }

    state = {
      isDraggingOver: false,
      rejected: [],
      ambiguous: []
    }

    handleFocus = (event: SyntheticEvent<HTMLDivElement>) => {
      const {onFocus} = this.props
      event.stopPropagation()
      if (onFocus) {
        onFocus(['$'])
      }
    }

    handlePaste = (event: SyntheticClipboardEvent<*>) => {
      // make sure the event target
      if (event.currentTarget === document.activeElement && event.clipboardData.files) {
        event.preventDefault()
        event.stopPropagation()
        this.uploadFiles(Array.from(event.clipboardData.files))
      }
    }

    handleDragOver = (event: SyntheticDragEvent<*>) => {
      if (this.props.onUpload) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    handleDragEnter = (event: SyntheticDragEvent<*>) => {
      event.stopPropagation()
      this.dragEnteredEls.push(event.target)
      this.setState({isDraggingOver: true})
    }

    handleDragLeave = (event: SyntheticDragEvent<*>) => {
      event.stopPropagation()
      const idx = this.dragEnteredEls.indexOf(event.target)
      if (idx > -1) {
        this.dragEnteredEls.splice(idx, 1)
      }
      if (this.dragEnteredEls.length === 0) {
        this.setState({isDraggingOver: false})
      }
    }

    handleDrop = (event: SyntheticDragEvent<*>) => {
      this.setState({isDraggingOver: false})
      if (this.props.onUpload) {
        const items = Array.from(event.dataTransfer.items).map(item => item.getAsFile())
        if (items.length === 0) {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        this.uploadFiles(items)
      }
    }

    uploadFiles(files: Array<File>) {
      const tasks = files.map(file => ({
        file,
        uploaderCandidates: this.props.getUploadOptions(file)
      }))

      const ready = tasks
        .filter(task => task.uploaderCandidates.length > 0)

      const rejected = tasks
        .filter(task => task.uploaderCandidates.length === 0)

      this.setState({rejected})

      // todo: consider if we need to ask the user
      // the list of candidates is sorted by their priority and the first one is selected
      // const ambiguous = tasks
      //   .filter(task => task.uploaderCandidates.length > 1)

      ready
        .forEach(task => {
          this.uploadFile(task.file, sortBy(task.uploaderCandidates, cand => cand.uploader.priority)[0])
        })
    }

    uploadFile(file: File, uploadOption: UploadOption) {
      const {onUpload} = this.props
      const {type, uploader} = uploadOption

      onUpload({file, type, uploader})
    }

    setElement = (element: ?HTMLDivElement) => {
      // Only care about focus events from children
      this._element = element
    }

    focus() {
      if (this._element) {
        this._element.focus()
      }
    }

    renderSnacks() {
      const {rejected, ambiguous} = this.state
      return (
        <div>
          {ambiguous.length > 0 && ( // not in use right now as we just pick the first uploader
            <Dialog
              isOpen
              title="Select how to represent"
              actions={[{title: 'Cancel'}]}
              onAction={() => this.setState({ambiguous: []})}
            >
              {ambiguous.map(task => (
                <div key={task.file.name}>
                  The file {task.file.name} can be converted to several types of content.
                  Please select how you want to represent it:
                  <ul>
                    {task.uploaderCandidates.map(uploaderCandidate => (
                      <li key={uploaderCandidate.type.name}>
                        <Button
                          onClick={() => {
                            this.uploadFile(task.file, uploaderCandidate)
                            this.setState({ambiguous: ambiguous.filter(t => t !== task)})
                          }}
                        >
                          Represent as {uploaderCandidate.type.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Dialog>
          )}
          {rejected.length > 0 && (
            <Snackbar
              kind="warning"
              action={{title: 'OK'}}
              onAction={() => this.setState({rejected: []})}
            >
              File(s) not accepted:
              {humanize(rejected.map(task => task.file.name))}
            </Snackbar>
          )}
        </div>
      )
    }

    render() {
      const {children, type, onUpload, getUploadOptions, ...rest} = this.props
      const {isDraggingOver} = this.state
      return (
        <Component
          {...rest}
          ref={this.setElement}
          onFocus={this.handleFocus}
          onPaste={this.handlePaste}
          onDragOver={this.handleDragOver}
          onDragEnter={this.handleDragEnter}
          onDragLeave={this.handleDragLeave}
          onDrop={this.handleDrop}
        >
          {isDraggingOver && (
            <div className={styles.dragStatus}>
              <h2 className={styles.dragStatusInner}>
                Drop to upload
              </h2>
            </div>
          )}
          {children}
          {this.renderSnacks()}
        </Component>
      )
    }
  }
}
