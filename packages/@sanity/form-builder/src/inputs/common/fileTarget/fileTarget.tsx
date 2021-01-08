import React from 'react'
import styled from 'styled-components'
import {useForwardedRef} from '@sanity/ui'
import {extractDroppedFiles, extractPastedFiles} from './utils/extractFiles'
import {imageUrlToBlob} from './utils/imageUrlToBlob'

// this is a hack for Safari that reads pasted image(s) from an ContentEditable div instead of the onpaste event
function convertImagesToFilesAndClearContentEditable(
  element: HTMLElement,
  targetFormat = 'image/jpeg'
): Promise<Array<File>> {
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

const PasteInput = styled.div`
  opacity: 0;
  position: absolute;
`

type Props = {
  onFiles?: (files: File[]) => void
  disabled?: boolean
  onDragEnter?: () => void
  onDragLeave?: () => void
}

type Todo = any

/**
 * Higher order component that creates a file target from a given component.
 * Returns a component that acts both as a drop target and a paste target, emitting a list of Files upon drop or paste
 */
export function fileTarget<ComponentProps>(Component: React.ComponentType<Todo>) {
  return React.forwardRef(function FileTarget(
    props: Props & Todo,
    ref: React.ForwardedRef<HTMLElement>
  ) {
    const {onFiles, onDragEnter, onDragLeave, disabled, ...rest} = props

    const [showPasteInput, setShowPasteInput] = React.useState(false)

    const pasteInput = React.useRef<HTMLDivElement | null>(null)
    const forwardedRef = useForwardedRef(ref)

    const enteredElements = React.useRef<Element[]>([])

    const handleKeyDown = (event: KeyboardEvent) => {
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
      event.preventDefault()
      event.stopPropagation()
      if (onFiles) {
        extractDroppedFiles(event.nativeEvent.dataTransfer).then((files) => {
          if (files) {
            emitFiles(files)
          }
        })
      }
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
      onDragEnter?.()
    }

    const handleDragLeave = (event: React.DragEvent) => {
      event.stopPropagation()
      const idx = enteredElements.current.indexOf(event.currentTarget)
      if (idx > -1) {
        enteredElements.current.splice(idx, 1)
      }
      if (enteredElements.current.length === 0) {
        onDragLeave?.()
      }
    }

    const emitFiles = (files: File[]) => {
      onFiles?.(files)
    }

    const prevShowPasteInput = React.useRef(false)
    React.useEffect(() => {
      if (!prevShowPasteInput.current && showPasteInput) {
        pasteInput.current?.focus()
        select(pasteInput.current) // Needed by Edge
      } else if (prevShowPasteInput.current && !showPasteInput) {
        pasteInput.current?.focus()
      }
      prevShowPasteInput.current = showPasteInput
    }, [showPasteInput])

    return (
      <>
        <Component
          {...rest}
          ref={forwardedRef}
          onKeyDown={disabled ? null : handleKeyDown}
          onDragOver={disabled ? null : handleDragOver}
          onDragEnter={disabled ? null : handleDragEnter}
          onDragLeave={disabled ? null : handleDragLeave}
          onDrop={disabled ? null : handleDrop}
        />
        {showPasteInput && <PasteInput contentEditable onPaste={handlePaste} ref={pasteInput} />}
      </>
    )
  })
}
