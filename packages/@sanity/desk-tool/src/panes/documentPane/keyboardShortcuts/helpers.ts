// ctrl + alt + i
export function isInspectHotkey(event: KeyboardEvent): boolean {
  return !event.shiftKey && event.ctrlKey && event.altKey && event.key === 'i'
}

// ctrl + alt + o
export function isPreviewHotkey(event: KeyboardEvent): boolean {
  return !event.shiftKey && event.ctrlKey && event.altKey && event.key === 'o'
}
