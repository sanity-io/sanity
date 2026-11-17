import {type ValueOf} from '@sanity/sdk/dashboard'
import {act, render, screen} from '@testing-library/react'
import {expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {ResourceCacheProvider} from '../../store/ResourceCacheProvider'
import {DashboardLink} from '../DashboardLink'

type ListedApplication = Extract<ValueOf<'applications.list'>, {ok: true}>['value'][number]

function application(
  fields: {id: string} & Partial<{
    type: 'studio' | 'coreApp'
    slug: string
    externalUrl: string
    local: {host: string; port: number}
  }>,
): ListedApplication {
  return {
    type: 'studio',
    title: '',
    name: '',
    reference: '',
    icon: null,
    isSingleton: false,
    visibility: 'default',
    slug: null,
    externalUrl: null,
    organizationId: 'org-1',
    createdAt: '',
    updatedAt: '',
    config: {},
    activeDeployment: null,
    ...fields,
  }
}

const APPLICATIONS = [
  // A dev server of the same studio, which has no route of its own to link to.
  application({id: 'players-dev', slug: 'players', local: {host: 'localhost', port: 3333}}),
  application({id: 'players-studio', slug: 'players'}),
  application({id: 'shop-studio', externalUrl: 'https://example.com/studio'}),
  application({id: 'drop-desk', type: 'coreApp', externalUrl: 'https://drop-desk.example.com'}),
]

function linkFor(href: string) {
  render(
    <ResourceCacheProvider>
      <DashboardLink href={href}>Open</DashboardLink>
    </ResourceCacheProvider>,
  )
  return screen.getByRole('link', {name: 'Open'})
}

it.each([
  {
    to: 'a Sanity-hosted studio',
    href: 'https://players.sanity.studio/players/intent/edit/id=p1;type=player/?x=1#top',
    hostHref: '/studios/players-studio/players/intent/edit/id=p1;type=player/?x=1#top',
  },
  {
    to: 'a studio hosted under a path',
    href: 'https://example.com/studio/default/structure',
    hostHref: '/studios/shop-studio/default/structure',
  },
  {
    to: 'an app',
    href: 'https://drop-desk.example.com/drops',
    hostHref: '/applications/drop-desk/drops',
  },
  {
    to: "a page outside a studio's path on a shared host",
    href: 'https://example.com/blog',
    hostHref: 'https://example.com/blog',
  },
  {
    to: 'a site the host does not list',
    href: 'https://unrelated.example/page',
    hostHref: 'https://unrelated.example/page',
  },
])('resolves a link to $to under a message bus host', ({href, hostHref}) => {
  const host = stubMessageBusHost()
  host.publish('applications.list', {ok: true, value: APPLICATIONS})

  const link = linkFor(href)

  expect(link).toHaveAttribute('href', hostHref)
})

const SITE = application({id: 'site', type: 'coreApp', externalUrl: 'https://example.com'})
const SHOP_STUDIO = application({id: 'shop-studio', externalUrl: 'https://example.com/studio'})

it.each([
  {order: 'listed first', applications: [SHOP_STUDIO, SITE]},
  {order: 'listed last', applications: [SITE, SHOP_STUDIO]},
])(
  'resolves a link into the most specific application on a shared host, $order',
  ({applications}) => {
    stubMessageBusHost().publish('applications.list', {ok: true, value: applications})

    expect(linkFor('https://example.com/studio/default/structure')).toHaveAttribute(
      'href',
      '/studios/shop-studio/default/structure',
    )
  },
)

it('never shows the previous link when the link changes', () => {
  const host = stubMessageBusHost()
  host.publish('applications.list', {ok: true, value: APPLICATIONS})
  const {rerender} = render(
    <ResourceCacheProvider>
      <DashboardLink href="https://players.sanity.studio/players/structure">Open</DashboardLink>
    </ResourceCacheProvider>,
  )
  const link = screen.getByRole('link', {name: 'Open'})
  const observer = new MutationObserver(() => {})
  observer.observe(link, {attributeFilter: ['href']})

  rerender(
    <ResourceCacheProvider>
      <DashboardLink href="https://drop-desk.example.com/drops">Open</DashboardLink>
    </ResourceCacheProvider>,
  )

  // One change, straight to the new link.
  expect(observer.takeRecords()).toHaveLength(1)
  observer.disconnect()
  expect(link).toHaveAttribute('href', '/applications/drop-desk/drops')
})

it("shows the host's route from the first paint, never the original link", () => {
  stubMessageBusHost().publish('applications.list', {ok: true, value: APPLICATIONS})
  const committedHrefs: Array<string | null> = []

  render(
    <ResourceCacheProvider>
      <DashboardLink
        href="https://drop-desk.example.com/drops"
        ref={(link) => {
          if (link) committedHrefs.push(link.getAttribute('href'))
        }}
      >
        Open
      </DashboardLink>
    </ResourceCacheProvider>,
  )

  expect(committedHrefs[0]).toBe('/applications/drop-desk/drops')
})

it('leaves the link alone without a message bus host', () => {
  const href = 'https://players.sanity.studio/players/structure'

  expect(linkFor(href)).toHaveAttribute('href', href)
})

it('follows the applications the message bus host lists', () => {
  const host = stubMessageBusHost()
  const href = 'https://players.sanity.studio/players/structure'
  const link = linkFor(href)
  expect(link).toHaveAttribute('href', href)

  act(() => host.publish('applications.list', {ok: true, value: APPLICATIONS}))

  expect(link).toHaveAttribute('href', '/studios/players-studio/players/structure')
})
