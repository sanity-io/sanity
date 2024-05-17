// This utils are inspired from https://github.dev/mwood23/slate-test-utils/blob/master/src/buildTestHarness.tsx
import {act, fireEvent, type render} from '@testing-library/react'
import {parseHotkey} from 'is-hotkey-esm'

export async function triggerKeyboardEvent(hotkey: string, element: Element): Promise<void> {
  return act(async () => {
    const eventProps = parseHotkey(hotkey)
    const values = hotkey.split('+')

    fireEvent(
      element,
      new window.KeyboardEvent('keydown', {
        key: values[values.length - 1],
        code: `${eventProps.which}`,
        keyCode: eventProps.which,
        bubbles: true,
        ...eventProps,
      }),
    )
  })
}

export async function getEditableElement(component: ReturnType<typeof render>): Promise<Element> {
  await act(async () => component)
  const element = component.container.querySelector('[data-slate-editor="true"]')
  if (!element) {
    throw new Error('Could not find element')
  }
  /**
   * Manually add this because JSDom doesn't implement this and Slate checks for it
   * internally before doing stuff.
   *
   * https://github.com/jsdom/jsdom/issues/1670
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  element.isContentEditable = true
  return element
}
