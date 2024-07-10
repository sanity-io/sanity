import {describe, expect, it} from '@jest/globals'
import {render} from '@testing-library/react'

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
          <RouterProvider onNavigate={() => null} router={router} state={{}}>
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
})
