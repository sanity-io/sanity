import {SDKStudioContext} from '@sanity/sdk-react'
import {renderHook} from '@testing-library/react'
import {type ReactNode, useContext} from 'react'
import {describe, expect, it} from 'vitest'

import {type Workspace} from '../config'
import {useWorkspace, WorkspaceProvider} from './workspace'

const mockWorkspace = {
  name: 'default',
  projectId: 'test-project',
  dataset: 'test-dataset',
} as unknown as Workspace

function wrapper({children}: {children: ReactNode}) {
  return <WorkspaceProvider workspace={mockWorkspace}>{children}</WorkspaceProvider>
}

describe('WorkspaceProvider', () => {
  it('exposes the workspace through WorkspaceContext via useWorkspace', () => {
    const {result} = renderHook(() => useWorkspace(), {wrapper})

    expect(result.current).toBe(mockWorkspace)
  })

  it('provides the same workspace to SDKStudioContext so the SDK works with zero config', () => {
    const {result} = renderHook(() => useContext(SDKStudioContext), {wrapper})

    expect(result.current).toBe(mockWorkspace)
  })
})
