import {useToast} from '@sanity/ui/toast'
import {useCallback} from 'react'

/**
 * Copies text to the clipboard and confirms with a toast. Falls back to a hidden textarea and
 * `execCommand` where the async clipboard API is unavailable (insecure contexts, some webviews).
 */
export function useCopyToClipboard(): (text: string, successTitle: string) => Promise<void> {
  const toast = useToast()

  return useCallback(
    async (text: string, successTitle: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          copyWithTextarea(text)
        }
        toast.push({closable: true, status: 'success', title: successTitle})
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: err instanceof Error ? err.message : String(err),
        })
      }
    },
    [toast],
  )
}

function copyWithTextarea(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = false
  try {
    // oxlint-disable-next-line no-deprecated -- fallback for environments without navigator.clipboard
    copied = document.execCommand('copy')
  } finally {
    textarea.remove()
  }
  if (!copied) {
    throw new Error('Copying to the clipboard is not allowed here')
  }
}
