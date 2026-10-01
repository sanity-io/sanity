import {type SanityClient} from '@sanity/client'
import {act, render, screen, waitFor} from '@testing-library/react'
import {type ComponentType, lazy, use, useContext, useMemo} from 'react'
import {useObservablePromise} from 'react-rx'
import {Subject} from 'rxjs'
import {createContext} from 'sanity/_createContext'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type LayoutProps, type ProviderProps} from '../../config/studio/types'
import {type SingleWorkspace} from '../../config/types'
import {PluginProviders} from '../PluginProviders'
import {StudioLayout} from '../StudioLayout'

/**
 * `studio.components.provider` renders above `StudioLayout` and its loading screen's Suspense
 * boundary, so a promise it starts can be `use()`d by `studio.components.layout`.
 */

const AnswerPromiseContext = createContext<Promise<string> | null>(
  'sanity/_singletons/context/test-studio-layout-answer-promise',
  null,
)

const answer$ = new Subject<string>()
const log: string[] = []

function AnswerProvider(props: ProviderProps) {
  const promise = useObservablePromise(useMemo(() => answer$.asObservable(), []))
  log.push('providers rendered')
  return <AnswerPromiseContext value={promise}>{props.renderDefault(props)}</AnswerPromiseContext>
}

function AnswerLayout() {
  const promise = useContext(AnswerPromiseContext)
  if (!promise) throw new Error('no providers above the layout')
  const answer = use(promise)
  log.push(`layout rendered with ${answer}`)
  return <div data-testid="layout">{answer}</div>
}

// Never calls `renderDefault`, so the default studio layout stays out of the test. The default
// plugins' lazy layouts wrap it, so it is reached once those have loaded.
const LazyAnswerLayout = lazy(() => {
  log.push('layout chunk requested')
  return Promise.resolve({default: AnswerLayout as ComponentType<LayoutProps>})
})

async function renderStudioLayout() {
  const config: Partial<SingleWorkspace> = {
    name: 'default',
    projectId: 'test',
    dataset: 'test',
    schema: {types: []},
    studio: {components: {provider: AnswerProvider, layout: LazyAnswerLayout}},
  }
  const TestProvider = await createTestProvider({
    client: createMockSanityClient() as unknown as SanityClient,
    config,
  })
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the layout suspends during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    render(
      <TestProvider>
        <PluginProviders>
          <StudioLayout />
        </PluginProviders>
      </TestProvider>,
    )
  })
}

describe('StudioLayout with studio.components.provider', () => {
  it(
    'commits the providers above the loading screen and lets the layout use() their promise',
    {timeout: 30_000},
    async () => {
      await renderStudioLayout()

      // The provider committed while the layout chain is still loading behind the loading screen
      expect(screen.getByTestId('loading-block')).toBeInTheDocument()
      expect(log).toContain('providers rendered')

      // The lazy chain loads outside `act`; once it reaches this layout, that suspends on the
      // unanswered promise behind the same loading screen
      await waitFor(() => expect(log).toContain('layout chunk requested'), {timeout: 15_000})
      expect(screen.getByTestId('loading-block')).toBeInTheDocument()
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument()
      expect(log.filter((entry) => entry.startsWith('layout rendered'))).toHaveLength(0)

      await act(async () => {
        answer$.next('42')
        answer$.complete()
      })

      // One committed layout render, with the answer
      expect(await screen.findByTestId('layout')).toHaveTextContent('42')
      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
      expect(log.filter((entry) => entry.startsWith('layout rendered'))).toEqual([
        'layout rendered with 42',
      ])
    },
  )
})
