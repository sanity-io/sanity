import {type SanityClient} from '@sanity/client'
import {act, render, type RenderResult, screen} from '@testing-library/react'
import {type ComponentType, lazy, Suspense} from 'react'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type ItemProps} from '../../../form/types/itemProps'
import {type PluginOptions, type SingleWorkspace} from '../../types'
import {useMiddlewareComponents} from '../useMiddlewareComponents'

interface LabelProps {
  label: string
}

interface LabelMiddlewareProps extends LabelProps {
  renderDefault: (props: LabelProps) => React.JSX.Element
}

function DefaultComponent({label}: LabelProps) {
  return <span data-testid="default">default:{label}</span>
}

function WrappingMiddleware(props: LabelMiddlewareProps) {
  return <span data-testid="middleware">middleware({props.renderDefault(props)})</span>
}

function pickItem(plugin: PluginOptions) {
  return plugin.form?.components?.item as unknown as ComponentType<LabelProps>
}

function Harness({label}: LabelProps) {
  const Component = useMiddlewareComponents({defaultComponent: DefaultComponent, pick: pickItem})
  // oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work
  return <Component label={label} />
}

async function renderHarness(item?: ComponentType<LabelMiddlewareProps>) {
  const config: Partial<SingleWorkspace> = {
    name: 'default',
    projectId: 'test',
    dataset: 'test',
    schema: {types: []},
  }
  if (item) {
    config.form = {components: {item: item as unknown as ComponentType<ItemProps>}}
  }
  const TestProvider = await createTestProvider({
    client: createMockSanityClient() as unknown as SanityClient,
    config,
  })

  let view!: RenderResult
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- a lazy middleware suspends during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    view = render(
      <TestProvider>
        <Suspense fallback={<div data-testid="site-fallback" />}>
          <Harness label="x" />
        </Suspense>
      </TestProvider>,
    )
  })
  return view
}

describe('useMiddlewareComponents', () => {
  it('renders the default component without touching the ancestor boundary', async () => {
    await renderHarness()

    expect(screen.getByTestId('default')).toHaveTextContent('default:x')
    expect(screen.queryByTestId('site-fallback')).not.toBeInTheDocument()
  })

  it('suspends to the ancestor boundary while a lazy middleware loads', async () => {
    let resolveMiddleware!: (component: ComponentType<LabelMiddlewareProps>) => void
    const LazyMiddleware = lazy(
      () =>
        new Promise<{default: ComponentType<LabelMiddlewareProps>}>((resolve) => {
          resolveMiddleware = (component) => resolve({default: component})
        }),
    )

    const {container} = await renderHarness(LazyMiddleware)

    expect(screen.getByTestId('site-fallback')).toBeInTheDocument()
    expect(container.querySelector('[data-ui="Skeleton"]')).toBeNull()
    expect(screen.queryByTestId('default')).not.toBeInTheDocument()

    await act(async () => {
      resolveMiddleware(WrappingMiddleware)
    })

    expect(screen.getByTestId('middleware')).toHaveTextContent('middleware(default:x)')
    expect(screen.queryByTestId('site-fallback')).not.toBeInTheDocument()
  })
})
