import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useInspectorBesideForm} from '../useInspectorBesideForm'

const state = vi.hoisted(() => ({
  features: {resizablePanes: true, responsiveInspector: false},
  layout: {collapsed: false as boolean | undefined, rootWidth: undefined as number | undefined},
}))

vi.mock('../../../../useStructureTool', () => ({
  useStructureTool: () => ({features: state.features}),
}))

vi.mock('../../../../components/pane/usePaneLayout', () => ({
  usePaneLayout: () => state.layout,
}))

function besideForm(options: {
  resizablePanes?: boolean
  responsiveInspector: boolean
  collapsed?: boolean
  rootWidth?: number
}) {
  state.features = {
    resizablePanes: options.resizablePanes ?? true,
    responsiveInspector: options.responsiveInspector,
  }
  state.layout = {collapsed: options.collapsed, rootWidth: options.rootWidth}
  return renderHook(() => useInspectorBesideForm()).result.current
}

describe('useInspectorBesideForm', () => {
  beforeEach(() => {
    state.features = {resizablePanes: true, responsiveInspector: false}
    state.layout = {collapsed: false, rootWidth: undefined}
  })

  describe('without responsiveInspector', () => {
    it('places the inspector beside the form whenever panes are resizable, however narrow', () => {
      expect(besideForm({responsiveInspector: false, rootWidth: 400})).toBe(true)
      expect(besideForm({responsiveInspector: false, rootWidth: 1600})).toBe(true)
    })

    it('places the inspector in place of the form when panes are not resizable', () => {
      expect(besideForm({responsiveInspector: false, resizablePanes: false, rootWidth: 1600})).toBe(
        false,
      )
    })
  })

  describe('with responsiveInspector', () => {
    it('places the inspector in place of the form when the layout is narrower than form and inspector', () => {
      expect(besideForm({responsiveInspector: true, rootWidth: 325})).toBe(false)
      expect(besideForm({responsiveInspector: true, rootWidth: 639})).toBe(false)
    })

    it('places the inspector beside the form when the layout fits both', () => {
      expect(besideForm({responsiveInspector: true, rootWidth: 640})).toBe(true)
      expect(besideForm({responsiveInspector: true, rootWidth: 1200})).toBe(true)
    })

    it('places the inspector in place of the form when the layout is collapsed', () => {
      expect(besideForm({responsiveInspector: true, collapsed: true, rootWidth: 1200})).toBe(false)
    })

    it('places the inspector beside the form until the layout has been measured', () => {
      expect(besideForm({responsiveInspector: true, rootWidth: undefined})).toBe(true)
    })
  })
})
