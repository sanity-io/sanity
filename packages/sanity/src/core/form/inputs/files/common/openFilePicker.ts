/**
 * Opens the native file picker by creating a temporary input element in document.body.
 * Removes the input after selection or when the user cancels (detected via window focus).
 *
 * @internal
 */
export function openFilePicker(options: {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect: (files: File[]) => void
  /** Called when the user cancels the file picker (e.g. to restore focus). */
  onCancel?: () => void
}): void {
  const {accept, capture, multiple, onSelect, onCancel} = options

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept ?? ''
  input.multiple = multiple ?? false
  if (capture) {
    input.capture = capture
  }
  input.style.display = 'none'
  input.setAttribute('data-testid', 'open-file-picker-input')

  let handled = false

  const cleanup = () => {
    if (input.isConnected) {
      input.remove()
    }
  }

  const handleChange = () => {
    handled = true
    window.removeEventListener('focus', handleCancel)
    if (input.files && input.files.length > 0) {
      onSelect(Array.from(input.files))
    }
    cleanup()
  }

  const handleCancel = () => {
    if (!handled) {
      onCancel?.()
      cleanup()
    }
  }

  input.addEventListener('change', handleChange, {once: true})
  // When user cancels the file dialog, window regains focus - remove the orphaned input
  window.addEventListener('focus', handleCancel, {once: true})

  document.body.appendChild(input)
  input.click()
}
