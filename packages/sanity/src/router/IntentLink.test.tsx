import {describe, expect, it} from '@jest/globals'
import {render} from '@testing-library/react'
import {noop} from 'lodash'

import {IntentLink} from './IntentLink'
import {route} from './route'
import {RouterProvider} from './RouterProvider'

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
        searchParams={[['perspective', `bundle.summer-drop`]]}
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
      '/test/intent/edit/id=document-id-123;type=document-type/?perspective=bundle.summer-drop',
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
              _searchParams: [['perspective', 'bundle.summer-drop']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      },
    )
    // Component should render the query param in the href
    expect(component.container.querySelector('a')?.href).toContain(
      '/test/intent/edit/id=document-id-123;type=document-type/?perspective=bundle.summer-drop',
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
        searchParams={[['perspective', `bundle.autumn-drop`]]}
      />,
      {
        wrapper: ({children}) => (
          <RouterProvider
            onNavigate={noop}
            router={router}
            state={{
              _searchParams: [['perspective', 'bundle.summer-drop']],
            }}
          >
            {children}
          </RouterProvider>
        ),
      },
    )
    // Component should render the query param in the href
    expect(component.container.querySelector('a')?.href).toContain(
      '/test/intent/edit/id=document-id-123;type=document-type/?perspective=bundle.autumn-drop',
    )
    expect(component.container.querySelector('a')?.href).not.toContain(
      'perspective=bundle.summer-drop',
    )
  })
})
