import {type PayloadOf, type ReplyOf, type ValueOf} from '@sanity/sdk/dashboard'
import {act, renderHook, screen, waitFor} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {canvasUsEnglishLocaleBundle} from '../i18n'
import {useCanvasNavigate} from '../useCanvasNavigate'

type ListedApplication = Extract<ValueOf<'applications.list'>, {ok: true}>['value'][number]

function installation(reference: string): ListedApplication {
  return {
    id: `installation-${reference}`,
    applicationId: reference,
    organizationId: 'org-1',
    installedBy: null,
    createdAt: '',
    updatedAt: '',
    application: {title: '', name: '', reference, slug: null, icon: null, organizationId: 'sanity'},
    activeConfig: null,
    access: [],
    interfaces: [],
  }
}

function application(reference: string): ListedApplication {
  return {
    id: `application-${reference}`,
    type: 'coreApp',
    title: '',
    name: '',
    reference,
    icon: null,
    isSingleton: true,
    visibility: 'default',
    slug: null,
    externalUrl: null,
    organizationId: 'sanity',
    createdAt: '',
    updatedAt: '',
    config: {},
    activeDeployment: null,
  }
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider({resources: [canvasUsEnglishLocaleBundle]})
})

// Resolves once the Canvas translations have loaded and the hook has rendered.
async function renderCanvas() {
  const view = renderHook(() => useCanvasNavigate(), {wrapper: TestProvider})
  await waitFor(() => expect(view.result.current).not.toBeNull())
  return view
}

function stubNavigationHost(
  answer: (
    payload: PayloadOf<'navigation.location.update'>,
  ) => ReplyOf<'navigation.location.update'>,
) {
  const host = stubMessageBusHost()
  const navigations: PayloadOf<'navigation.location.update'>[] = []
  host.respond('navigation.location.update', (message) => {
    navigations.push(message.payload)
    message.reply(answer(message.payload))
  })
  return navigations
}

it('opens Canvas inside a message bus host', async () => {
  const navigations = stubNavigationHost(() => ({ok: true}))
  const {result} = await renderCanvas()

  act(() => result.current.openCanvas('doc/canvas-1'))

  await waitFor(() => expect(navigations).toEqual([{url: '/canvas/doc/canvas-1', history: 'push'}]))
})

it.each([
  {
    failure: 'rejects the navigation',
    answer: (): ReplyOf<'navigation.location.update'> => ({ok: false, reason: 'not-navigable'}),
  },
  {
    failure: 'fails to answer',
    answer: () => {
      throw new Error('no router')
    },
  },
])('shows an error when the host $failure', async ({answer}) => {
  stubNavigationHost(answer)
  const {result} = await renderCanvas()

  act(() => result.current.openCanvas('doc/canvas-1'))

  expect(await screen.findByText('Failed to open Canvas')).toBeInTheDocument()
})

it.each([
  {shape: 'an installation', listed: installation},
  {shape: 'an application', listed: application},
])('is available only while the message bus host lists Canvas as $shape', async ({listed}) => {
  const host = stubMessageBusHost()
  const {result} = await renderCanvas()
  expect(result.current.isAvailable).toBe(false)

  act(() =>
    host.publish('applications.list', {
      ok: true,
      value: [listed('sanity/media-library'), listed('sanity/canvas')],
    }),
  )
  await waitFor(() => expect(result.current.isAvailable).toBe(true))

  act(() => host.publish('applications.list', {ok: true, value: [listed('sanity/media-library')]}))
  await waitFor(() => expect(result.current.isAvailable).toBe(false))
})

it('is unavailable once the message bus host fails to load its applications', async () => {
  const host = stubMessageBusHost()
  const {result} = await renderCanvas()
  act(() => host.publish('applications.list', {ok: true, value: [installation('sanity/canvas')]}))
  await waitFor(() => expect(result.current.isAvailable).toBe(true))

  act(() => host.publish('applications.list', {ok: false}))

  await waitFor(() => expect(result.current.isAvailable).toBe(false))
})

it('is available without a message bus host, which does not say', async () => {
  const {result} = await renderCanvas()

  expect(result.current.isAvailable).toBe(true)
})
