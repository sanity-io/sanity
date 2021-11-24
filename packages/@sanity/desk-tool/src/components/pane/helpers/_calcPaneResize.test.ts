import {_calcPaneResize} from './_helpers'
import {PaneConfig, PaneResizeCache} from './types'

describe('@sanity/desk-tool/components/pane', () => {
  describe('_calcPaneResize', () => {
    it('should calculate pane resize', () => {
      const cache: PaneResizeCache = {
        left: {element: null as any, flex: 1, width: 350},
        right: {element: null as any, flex: 2, width: 400},
      }

      const leftPane: PaneConfig = {element: null as any, opts: {minWidth: 320 / 2, maxWidth: 500}}
      const rightPane: PaneConfig = {element: null as any, opts: {minWidth: 320 / 2}}

      // move resizer to left
      expect(_calcPaneResize(cache, leftPane, rightPane, -200)).toEqual({
        leftFlex: 0.64,
        leftW: 160,
        rightFlex: 2.36,
        rightW: 590,
      })

      // move resizer to right
      expect(_calcPaneResize(cache, leftPane, rightPane, 300)).toEqual({
        leftFlex: 2,
        leftW: 500,
        rightFlex: 1,
        rightW: 250,
      })
    })
  })
})
