import {ImperativeToast} from '@sanity/base/components'
import {ToastParams, Text} from '@sanity/ui'
import React from 'react'
import {Path, SchemaType} from '@sanity/types'
import humanize from 'humanize-list'
import {sortBy} from 'lodash'
// todo: define this as a core interface in this package (e.g. import from src/types.ts or similar instead of the sanity folder)
import {ResolvedUploader, Uploader} from '../../../../sanity/uploads/types'
import {fileTarget} from '../../../common/fileTarget'
import {Overlay} from './styles'

type Props = {
  type: SchemaType
  children: React.ReactChildren | null
  className?: string
  onFocus: (path: Path) => void
  getUploadOptions: (file: File) => ResolvedUploader[]
  onUpload?: (event: {type: SchemaType; file: File; uploader: Uploader}) => void
}

type UploadTask = {
  file: File
  uploaderCandidates: ResolvedUploader[]
}

type State = {
  isDraggingOver: boolean
}

export function uploadTarget<T>(Component: any): React.ComponentType<any> {
  const FileTarget = fileTarget(Component)

  return class UploadTarget extends React.Component<Props & T, State> {
    toast: {push: (params: ToastParams) => void} | null = null

    _element: HTMLElement | null = null

    state: State = {
      isDraggingOver: false,
    }
    handleReceiveFiles = (files: File[]) => {
      this.setState({isDraggingOver: false})
      this.uploadFiles(files)
    }
    handleDragEnter = (event: React.DragEvent) => {
      this.setState({isDraggingOver: true})
    }
    handleDragLeave = (event: React.DragEvent) => {
      this.setState({isDraggingOver: false})
    }

    uploadFiles(files: File[]) {
      const tasks: UploadTask[] = files.map((file) => ({
        file,
        uploaderCandidates: this.props.getUploadOptions(file),
      }))
      const ready = tasks.filter((task) => task.uploaderCandidates.length > 0)
      const rejected: UploadTask[] = tasks.filter((task) => task.uploaderCandidates.length === 0)

      if (rejected.length > 0) {
        this.toast?.push({
          closable: true,
          status: 'warning',
          title: 'File(s) not accepted',
          description: humanize(rejected.map((task) => task.file.name)),
        })
      }

      // todo: consider if we should to ask the user here
      // the list of candidates is sorted by their priority and the first one is selected
      // const ambiguous = tasks
      //   .filter(task => task.uploaderCandidates.length > 1)
      ready.forEach((task) => {
        this.uploadFile(
          task.file,
          sortBy(task.uploaderCandidates, (candidate) => candidate.uploader.priority)[0]
        )
      })
    }

    uploadFile(file: File, resolvedUploader: ResolvedUploader) {
      const {onUpload} = this.props
      const {type, uploader} = resolvedUploader
      onUpload?.({file, type, uploader})
    }
    setElement = (element: any) => {
      // Only care about focus events from children
      this._element = element
    }

    focus() {
      if (this._element) {
        this._element.focus()
      }
    }

    setToast = (toast: {push: (params: ToastParams) => void}) => {
      this.toast = toast
    }

    render() {
      const {children, type, onUpload, getUploadOptions, ...rest} = this.props
      const {isDraggingOver} = this.state
      return (
        <div style={{position: 'relative'}}>
          <ImperativeToast ref={this.setToast} />
          <FileTarget
            {...rest}
            ref={this.setElement}
            onFiles={this.handleReceiveFiles}
            onDragEnter={this.handleDragEnter}
            onDragLeave={this.handleDragLeave}
          >
            {isDraggingOver && (
              <Overlay>
                <Text>Drop to upload</Text>
              </Overlay>
            )}
            {children}
          </FileTarget>
        </div>
      )
    }
  }
}
