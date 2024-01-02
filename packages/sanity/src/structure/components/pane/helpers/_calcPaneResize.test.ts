import {PaneConfigOpts, PaneResizeCache} from '../types'
import {_calcPaneResize} from './_calcPaneResize'

describe('@sanity/desk-tool/components/pane', () => {
  describe('_calcPaneResize', () => {
    it('should calculate pane resize', () => {
      const cache: PaneResizeCache = {
        left: {element: null as any, flex: 1, width: 250},
        right: {element: null as any, flex: 1, width: 250},
      }

      const leftPane: PaneConfigOpts = {
        flex: 1,
        id: 'left',
        minWidth: 100,
        maxWidth: 500,
      }

      const rightPane: PaneConfigOpts = {
        flex: 1,
        id: 'right',
        minWidth: 100,
      }

      // move resizer to left
      expect(_calcPaneResize(cache, leftPane, rightPane, -200)).toEqual({
        leftFlex: 0.4,
        leftW: 100,
        rightFlex: 1.6,
        rightW: 400,
      })

      // move resizer to right
      expect(_calcPaneResize(cache, leftPane, rightPane, 300)).toEqual({
        leftFlex: 1.6,
        leftW: 400,
        rightFlex: 0.4,
        rightW: 100,
      })

      // case 2
      cache.left.width = 100
      cache.right.width = 400

      // move resizer to left
      expect(_calcPaneResize(cache, leftPane, rightPane, -60)).toEqual({
        leftFlex: 0.4,
        leftW: 100,
        rightFlex: 1.6,
        rightW: 400,
      })

      // case 3
      cache.left.flex = 4
      cache.left.width = 400
      cache.right.flex = 6
      cache.right.width = 600

      // move resizer to left
      expect(_calcPaneResize(cache, leftPane, rightPane, 200)).toEqual({
        leftFlex: 5,
        leftW: 500,
        rightFlex: 5,
        rightW: 500,
      })
    })
  })
})
