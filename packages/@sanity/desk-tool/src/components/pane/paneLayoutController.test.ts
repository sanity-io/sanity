import {createPaneLayoutController} from './paneLayoutController'

describe('paneLayoutController', () => {
  it('should emit state changes', () => {
    const ctrl = createPaneLayoutController()

    // Subscribe to state changes
    const setStateFn = jest.fn()
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
})
