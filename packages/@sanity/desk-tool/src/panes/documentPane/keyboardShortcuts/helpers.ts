const KEY_I = 73
const KEY_O = 79

export function isInspectHotkey(event: KeyboardEvent): boolean {
  return event.ctrlKey && event.keyCode === KEY_I && event.altKey && !event.shiftKey
}

export function isPreviewHotkey(event: KeyboardEvent): boolean {
  return event.ctrlKey && event.keyCode === KEY_O && event.altKey && !event.shiftKey
}
