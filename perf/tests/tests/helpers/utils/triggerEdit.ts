function triggerInsertTextEvent(element: HTMLElement, nextValue: string) {
  if (!element.contentEditable) {
    throw new Error('Cannot trigger insert text event on non-contenteditable element')
  }
  element.dispatchEvent(
    new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: nextValue,
    }),
  )
}

function triggerInputEvent(input: HTMLInputElement, nextValue: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    input.constructor.prototype,
    'value',
  )!.set!

  nativeInputValueSetter.call(input, nextValue)
  input.dispatchEvent(new Event('input', {bubbles: true}))
}

const TEXT_INPUT_TAGS = ['input', 'textarea']
export function triggerEditEvent(element: HTMLElement, nextValue: string) {
  if (TEXT_INPUT_TAGS.includes(element.tagName.toLowerCase())) {
    return triggerInputEvent(element as HTMLInputElement, nextValue)
  }
  return triggerInsertTextEvent(element, nextValue)
}
