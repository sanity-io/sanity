import React from 'react'
import {useForwardedRef} from '@sanity/ui'
import {extractDroppedFiles, extractPastedFiles} from './utils/extractFiles'
import {imageUrlToBlob} from './utils/imageUrlToBlob'

export type FileInfo = {
  kind: DataTransferItem['kind'] // 'file' or 'string'
  type: DataTransferItem['type'] // mime type of file or string
}

type Props = {
  // Triggered when the target component receives one or more files, either originating from a drop event or a paste event
  onFiles?: (files: File[]) => void

  // Triggered by the user dragging files over the target component
  // Note: We can potentially also support reading from clipboard events here: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
  onFilesOver?: (files: FileInfo[]) => void

  // Triggered by the user dragging files out of the target component
  onFilesOut?: () => void

  disabled?: boolean
}

// These are managed and can't be passed to the composed component
type ManagedProps =
  | 'onDrop'
  | 'onDragOver'
  | 'onPaste'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onKeyDown'

const PASTE_INPUT_STYLE = {opacity: 0, position: 'absolute'} as const

/**
 * Higher order component that creates a file target from a given component.
 * Returns a component that acts both as a drop target and a paste target, emitting a list of Files upon drop or paste
 */
export function fileTarget<ComponentProps>(Component: React.ComponentType<ComponentProps>) {
  return React.forwardRef(function FileTarget(
    props: Omit<ComponentProps, ManagedProps> & Props,
    ref: React.ForwardedRef<HTMLElement>
  ) {
    const {onFiles, onFilesOver, onFilesOut, disabled, ...rest} = props

    const [showPasteInput, setShowPasteInput] = React.useState(false)

    const pasteInput = React.useRef<HTMLDivElement | null>(null)
    const forwardedRef = useForwardedRef(ref)

    const enteredElements = React.useRef<Element[]>([])

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (
        event.target === forwardedRef.current &&
        (event.ctrlKey || event.metaKey) &&
        event.key === 'v'
      ) {
        setShowPasteInput(true)
      }
    }
    const handlePaste = (event: React.ClipboardEvent) => {
      extractPastedFiles(event.clipboardData)
        .then((files) => {
          if (!pasteInput.current) {
            return []
          }
          return files.length > 0
            ? files
            : // Invoke Safari hack if we didn't get any files
              convertImagesToFilesAndClearContentEditable(pasteInput.current, 'image/jpeg')
        })
        .then((files) => {
          emitFiles(files)
          setShowPasteInput(false)
          forwardedRef.current?.focus()
        })
    }
    const handleDrop = (event: React.DragEvent) => {
      enteredElements.current = []
      event.preventDefault()
      event.stopPropagation()
      const dataTransfer = event.nativeEvent.dataTransfer
      if (onFiles && dataTransfer) {
        extractDroppedFiles(dataTransfer).then((files) => {
          if (files) {
            emitFiles(files)
          }
        })
      }
      onFilesOut?.()
    }

    const handleDragOver = (event: React.DragEvent) => {
      if (onFiles) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleDragEnter = (event: React.DragEvent) => {
      event.stopPropagation()
      enteredElements.current.push(event.currentTarget)
      if (onFilesOver && enteredElements.current.length === 1) {
        const fileTypes = Array.from(event.dataTransfer.items).map((item) => ({
          type: item.type,
          kind: item.kind,
        }))
        onFilesOver(fileTypes)
      }
    }

    const handleDragLeave = (event: React.DragEvent) => {
      event.stopPropagation()
      const idx = enteredElements.current.indexOf(event.currentTarget)
      if (idx > -1) {
        enteredElements.current.splice(idx, 1)
      }
      if (enteredElements.current.length === 0) {
        onFilesOut?.()
      }
    }

    const emitFiles = (files: File[]) => {
      onFiles?.(files)
    }

    const prevShowPasteInput = React.useRef(false)
    React.useEffect(() => {
      if (!prevShowPasteInput.current && showPasteInput && pasteInput.current) {
        pasteInput.current.focus()
        select(pasteInput.current) // Needed by Edge
      } else if (prevShowPasteInput.current && !showPasteInput) {
        pasteInput.current?.focus()
      }
      prevShowPasteInput.current = showPasteInput
    }, [showPasteInput])

    return (
      <>
        <Component
          {...(rest as ComponentProps)}
          ref={forwardedRef}
          onKeyDown={!disabled && handleKeyDown}
          onDragOver={!disabled && handleDragOver}
          onDragEnter={!disabled && handleDragEnter}
          onDragLeave={!disabled && handleDragLeave}
          onDrop={!disabled && handleDrop}
        />
        {!disabled && showPasteInput && (
          <div contentEditable onPaste={handlePaste} ref={pasteInput} style={PASTE_INPUT_STYLE} />
        )}
      </>
    )
  })
}

// this is a hack for Safari that reads pasted image(s) from an ContentEditable div instead of the onpaste event
function convertImagesToFilesAndClearContentEditable(
  element: HTMLElement,
  targetFormat = 'image/jpeg'
): Promise<File[]> {
  if (!element.isContentEditable) {
    return Promise.reject(
      new Error(
        `Expected element to be contentEditable="true". Instead found a non contenteditable ${element.tagName}`
      )
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
function select(el: Element) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}
