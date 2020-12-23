import React from 'react'
import ReactDOM from 'react-dom'
import {Path, SchemaType} from '@sanity/types'
import humanize from 'humanize-list'
import {sortBy} from 'lodash'
import Snackbar from 'part:@sanity/components/snackbar/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import {Button} from '@sanity/ui'
import {ResolvedUploader} from '../../../sanity/uploads/types'
import styles from './UploadTarget.css'
import {extractDroppedFiles, extractPastedFiles} from './extractFiles'
import {imageUrlToBlob} from './imageUrlToBlob'

type Props = {
  type: SchemaType
  children: React.ReactChildren | null
  className?: string
  onFocus: (path: Path) => void
  getUploadOptions: (file: File) => ResolvedUploader[]
  onUpload?: ({type: Type, file: File, uploader: Uploader}) => void
}

type UploadTask = {
  file: File
  uploaderCandidates: ResolvedUploader[]
}

type State = {
  rejected: UploadTask[]
  ambiguous: UploadTask[]
  showPasteInput: boolean
  isDraggingOver: boolean
}

// this is a hack for Safari that reads pasted image(s) from an ContentEditable div instead of the onpaste event
function convertImagesToFilesAndClearContentEditable(
  element: HTMLDivElement,
  targetFormat = 'image/jpeg'
): Promise<Array<File>> {
  if (!element.isContentEditable) {
    throw new Error(
      `Expected element to be contentEditable="true". Instead found a non contenteditable ${element.tagName}`
    )
  }
  return new Promise((resolve) => setTimeout(resolve, 10)) // add a delay so the paste event can finish
    .then(() => Array.from(element.querySelectorAll('img')))
    .then((imageElements) => {
      element.innerHTML = '' // clear
      return imageElements
    })
    .then((images) => Promise.all(images.map((img) => imageUrlToBlob(img.src))))
    .then((imageBlobs) =>
      imageBlobs.map((blob) => new File([blob], 'pasted-image.jpg', {type: targetFormat}))
    )
}

// needed by Edge
function select(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

export function createUploadTarget<T>(Component: any): React.ComponentType<any> {
  return class UploadTargetFieldset extends React.Component<Props & T, State> {
    _pasteInput: HTMLInputElement | null
    _element: any
    dragEnteredEls: Array<Element> = []
    static defaultProps = {
      tabIndex: 0,
    }
    state: State = {
      isDraggingOver: false,
      showPasteInput: false,
      rejected: [],
      ambiguous: [],
    }
    handleFocus = (path: Path) => {
      const {onFocus} = this.props
      if (onFocus) {
        onFocus(Array.isArray(path) ? path : ['$'])
      }
    }
    handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target === ReactDOM.findDOMNode(this) &&
        (event.ctrlKey || event.metaKey) &&
        event.key === 'v'
      ) {
        this.setState({showPasteInput: true})
      }
    }
    handlePaste = (event: React.ClipboardEvent) => {
      extractPastedFiles(event.clipboardData)
        .then((files) => {
          return files.length > 0
            ? files // Invoke Safari hack
            : convertImagesToFilesAndClearContentEditable(this._pasteInput, 'image/jpeg')
        })
        .then((files) => {
          this.uploadFiles(files)
          this.setState({showPasteInput: false})
        })
    }
    handleDrop = (event: React.DragEvent) => {
      this.setState({isDraggingOver: false})
      event.preventDefault()
      event.stopPropagation()
      if (this.props.onUpload) {
        extractDroppedFiles(event.nativeEvent.dataTransfer).then((files) => {
          if (files) {
            this.uploadFiles(files)
          }
        })
      }
    }
    handleDragOver = (event: React.DragEvent) => {
      if (this.props.onUpload) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    handleDragEnter = (event: React.DragEvent) => {
      event.stopPropagation()
      this.dragEnteredEls.push(event.currentTarget)
      this.setState({isDraggingOver: true})
    }
    handleDragLeave = (event: React.DragEvent) => {
      event.stopPropagation()
      const idx = this.dragEnteredEls.indexOf(event.currentTarget)
      if (idx > -1) {
        this.dragEnteredEls.splice(idx, 1)
      }
      if (this.dragEnteredEls.length === 0) {
        this.setState({isDraggingOver: false})
      }
    }

    uploadFiles(files: Array<File>) {
      const tasks: UploadTask[] = files.map((file) => ({
        file,
        uploaderCandidates: this.props.getUploadOptions(file),
      }))
      const ready = tasks.filter((task) => task.uploaderCandidates.length > 0)
      const rejected: UploadTask[] = tasks.filter((task) => task.uploaderCandidates.length === 0)
      this.setState({rejected})
      // todo: consider if we need to ask the user
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
      onUpload({file, type, uploader})
    }

    componentDidUpdate(_, prevState) {
      if (!prevState.showPasteInput && this.state.showPasteInput) {
        this._pasteInput.focus()
        select(this._pasteInput) // Needed by Edge
      } else if (prevState.showPasteInput && !this.state.showPasteInput) {
        this.focus()
      }
    }

    setPasteInput = (element: HTMLInputElement | null) => {
      // Only care about focus events from children
      this._pasteInput = element
    }
    setElement = (element) => {
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
      const len = ambiguous.length + rejected.length

      if (len === 0) return null

      return (
        <div>
          {ambiguous.length > 0 && ( // not in use right now as we just pick the first uploader
            <Dialog
              isOpen
              title="Select how to represent"
              actions={[{title: 'Cancel'}]}
              onAction={() => this.setState({ambiguous: []})}
            >
              {ambiguous.map((task) => (
                <div key={task.file.name}>
                  The file {task.file.name} can be converted to several types of content. Please
                  select how you want to represent it:
                  <ul>
                    {task.uploaderCandidates.map((uploaderCandidate) => (
                      <li key={uploaderCandidate.type.name}>
                        <Button
                          onClick={() => {
                            this.uploadFile(task.file, uploaderCandidate)
                            this.setState({
                              ambiguous: ambiguous.filter((t) => t !== task),
                            })
                          }}
                          text={`Represent as ${uploaderCandidate.type.name}`}
                        />
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
              isPersisted
              actionTitle="OK"
              onAction={() => this.setState({rejected: []})}
              title="File(s) not accepted:"
              subtitle={humanize(rejected.map((task) => task.file.name))}
            />
          )}
        </div>
      )
    }

    render() {
      const {children, type, onUpload, getUploadOptions, ...rest} = this.props
      const {isDraggingOver, showPasteInput} = this.state
      return (
        <Component
          {...rest}
          ref={this.setElement}
          onFocus={this.handleFocus}
          onKeyDown={this.handleKeyPress}
          onDragOver={this.handleDragOver}
          onDragEnter={this.handleDragEnter}
          onDragLeave={this.handleDragLeave}
          onDrop={this.handleDrop}
        >
          {isDraggingOver && (
            <div className={styles.dragStatus}>
              <h2 className={styles.dragStatusInner}>Drop to upload</h2>
            </div>
          )}
          {showPasteInput && (
            <div className={styles.dragStatus}>
              <div
                contentEditable
                onPaste={this.handlePaste}
                className={styles.pasteInput}
                ref={this.setPasteInput}
              />
              <h2 className={styles.dragStatusInner}>Paste (Ctrl+V or ⌘+V) to upload</h2>
            </div>
          )}
          {children}
          {this.renderSnacks()}
        </Component>
      )
    }
  }
}
