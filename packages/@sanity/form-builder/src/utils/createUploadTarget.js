// @flow
import React from 'react'
import type {Path} from '../typedefs/path'
import {sortBy} from 'lodash'

import type {Uploader} from '../sanity/uploads/typedefs'
import type {Type} from '../typedefs'

import Snackbar from 'part:@sanity/components/snackbar/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import humanize from 'humanize-list'
import type {ArrayType} from '../inputs/Array/typedefs'

type Props = {
  type: ArrayType,
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

    static defaultProps = {
      tabIndex: 0
    }

    state = {
      rejected: [],
      ambiguous: []
    }

    handleFocus = (event: SyntheticEvent<HTMLDivElement>) => {
      const {onFocus} = this.props
      event.stopPropagation()
      if (onFocus) {
        onFocus(event)
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

    handleDrop = (event: SyntheticDragEvent<*>) => {

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
      const {children, onUpload, getUploadOptions, ...rest} = this.props
      return (
        <Component
          {...rest}
          ref={this.setElement}
          onFocus={this.handleFocus}
          onPaste={this.handlePaste}
          onDragOver={this.handleDragOver}
          onDrop={this.handleDrop}
        >
          {children}
          {this.renderSnacks()}
        </Component>
      )
    }
  }
}
