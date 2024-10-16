import {render} from '@testing-library/react'
import {noop} from 'lodash'
import {describe, expect, it, vi} from 'vitest'

import {IntentLink} from './IntentLink'
import {route} from './route'
import {RouterProvider} from './RouterProvider'

vi.mock('./stickyParams', () => ({
  STICKY_PARAMS: ['aTestStickyParam'],
}))

describe('IntentLink', () => {
  it('should resolve intent link with query params', () => {
    const router = route.create('/test', [route.intents('/intent')])
    const component = render(
      <IntentLink
        intent="edit"
        params={{
          id: 'document-id-123',
          type: 'document-type',
        }}
        searchParams={[['aTestStickyParam', `aStickyParam.value`]]}
      />,
      {
        wrapper: ({children}) => (
          <RouterProvider onNavigate={noop} router={router} state={{}}>
            {children}
          </RouterProvider>
        ),
      },
    )
    // Component should render the query param in the href
    expect(component.container.querySelector('a')?.href).toContain(
      '/test/intent/edit/id=document-id-123;type=document-type/?aTestStickyParam=aStickyParam.value',
    )
  })

  it('should preserve sticky parameters when resolving intent link', () => {
    const router = route.create('/test', [route.intents('/intent')])
    const component = render(
      <IntentLink
        intent="edit"
        params={{
          id: 'document-id-123',
          type: 'document-type',
        }}
      />,
      {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={noop}
            router={router}
            state={{
              _searchParams: [['aTestStickyParam', 'aStickyParam.value']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      },
    )
    // Component should render the query param in the href
    expect(component.container.querySelector('a')?.href).toContain(
      '/test/intent/edit/id=document-id-123;type=document-type/?aTestStickyParam=aStickyParam.value',
    )
  })

  it('should allow sticky parameters to be overridden when resolving intent link', () => {
    const router = route.create('/test', [route.intents('/intent')])
    const component = render(
      <IntentLink
        intent="edit"
        params={{
          id: 'document-id-123',
          type: 'document-type',
        }}
        searchParams={[['aTestStickyParam', `aStickyParam.value.to-be-defined`]]}
      />,
      {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={noop}
            router={router}
            state={{
              _searchParams: [['aTestStickyParam', 'aStickyParam.value.to-be-overridden']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      },
    )
    // Component should render the query param in the href
    expect(component.container.querySelector('a')?.href).toContain(
      '/test/intent/edit/id=document-id-123;type=document-type/?aTestStickyParam=aStickyParam.value.to-be-defined',
    )
    expect(component.container.querySelector('a')?.href).not.toContain(
      'aTestStickyParam=aStickyParam.value.to-be-overridden',
    )
  })
})
