import {describe, expect, it, vi} from 'vitest'

import {
  createPaneLayoutController,
  type PaneLayoutController,
  type PaneLayoutState,
} from './paneLayoutController'
import {type PaneConfigOpts} from './types'

// jsdom does no layout, so panes need a width to resize against
function mountPane(
  ctrl: PaneLayoutController,
  rootElement: HTMLElement,
  options: PaneConfigOpts,
  width: number,
) {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => new DOMRect(0, 0, width, 0)
  rootElement.appendChild(element)
  ctrl.mount(element, options)
  return element
}

describe('paneLayoutController', () => {
  it('should emit state changes', () => {
    const ctrl = createPaneLayoutController()

    // Subscribe to state changes
    const setStateFn = vi.fn()
    ctrl.subscribe(setStateFn)

    // Set root element (layout containing panes)
    const rootElement = document.createElement('div')
    ctrl.setRootElement(rootElement)

    // Mount pane #1
    const pane1Element = document.createElement('div')
    rootElement.appendChild(pane1Element)
    ctrl.mount(pane1Element, {flex: 1, id: 'pane-1', minWidth: 100})

    // Mount pane #2
    const pane2Element = document.createElement('div')
    rootElement.appendChild(pane2Element)
    ctrl.mount(pane2Element, {flex: 1, id: 'pane-2', minWidth: 100})

    // Update layout width
    ctrl.setRootWidth(300)

    expect(setStateFn.mock.calls.length).toBe(1)

    // Resize the layout
    ctrl.resize('start', pane1Element, 0)
    ctrl.resize('move', pane1Element, -100)
    ctrl.resize('move', pane1Element, 100)
    ctrl.resize('end', pane1Element, 100)

    expect(setStateFn.mock.calls.length).toBe(5)
  })

  it('caps each pane at its own width when a divider is released', () => {
    const ctrl = createPaneLayoutController()
    const states: PaneLayoutState[] = []
    ctrl.subscribe((state) => states.push(state))

    const rootElement = document.createElement('div')
    ctrl.setRootElement(rootElement)

    const leftElement = mountPane(
      ctrl,
      rootElement,
      {flex: 1, id: 'left', minWidth: 320, maxWidth: 640},
      400,
    )
    mountPane(ctrl, rootElement, {flex: 1, id: 'right', minWidth: 200, maxWidth: 400}, 300)

    ctrl.setRootWidth(700)
    ctrl.resize('start', leftElement, 0)
    ctrl.resize('move', leftElement, 50)
    ctrl.resize('end', leftElement, 50)

    // Not the left pane's 640 for both panes
    expect(states.at(-1)?.panes.map((pane) => pane.currentMaxWidth)).toEqual([450, 250])
  })

  it('stops notifying an observer once it unsubscribes', () => {
    const ctrl = createPaneLayoutController()
    const unsubscribed = vi.fn()
    const subscribed = vi.fn()
    const unsubscribe = ctrl.subscribe(unsubscribed)
    ctrl.subscribe(subscribed)

    const rootElement = document.createElement('div')
    ctrl.setRootElement(rootElement)
    mountPane(ctrl, rootElement, {flex: 1, id: 'pane', minWidth: 100}, 300)

    unsubscribe()
    ctrl.setRootWidth(300)

    expect(unsubscribed).not.toHaveBeenCalled()
    expect(subscribed).toHaveBeenCalledTimes(1)
  })
})
