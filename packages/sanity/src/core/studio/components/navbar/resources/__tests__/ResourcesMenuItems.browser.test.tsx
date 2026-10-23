import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {WorkspacesContext} from 'sanity/_singletons'
import {SemVer} from 'semver'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {type ResourcesResponse} from '../helper-functions/types'
import {ResourcesMenuItems} from '../ResourcesMenuItems'

// The `/help` response the menu renders when it loads successfully.
const RESOURCES: ResourcesResponse = {
  resources: {
    title: 'Help and resources',
    sectionArray: [
      {
        _key: 'learn',
        items: [
          {
            _key: 'docs',
            _type: 'externalLink',
            title: 'Documentation',
            url: 'https://www.sanity.io/docs',
          },
          {
            _key: 'courses',
            _type: 'externalLink',
            title: 'Sanity Learn',
            url: 'https://www.sanity.io/learn',
          },
        ],
      },
      {
        _key: 'support',
        items: [
          {
            _key: 'community',
            _type: 'externalLink',
            title: 'Join our community',
            url: 'https://www.sanity.io/exchange/community',
          },
          {
            _key: 'help',
            _type: 'externalLink',
            title: 'Help and support',
            url: 'https://www.sanity.io/contact/support',
          },
        ],
      },
    ],
  },
}

const WORKSPACES = createWorkspaceSummaries([
  {name: 'default', title: 'Test Studio', projectId: 'test', dataset: 'test'},
])

function ResourcesMenuItemsHarness(props: {latestTaggedVersion?: SemVer}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <WorkspacesContext.Provider value={WORKSPACES}>
        <Card style={{maxWidth: 320}}>
          <Menu>
            <ResourcesMenuItems
              currentVersion={new SemVer('5.0.0')}
              error={null}
              isLoading={false}
              latestTaggedVersion={props.latestTaggedVersion}
              onOpenStudioVersionDialog={noop}
              value={RESOURCES}
            />
          </Menu>
        </Card>
      </WorkspacesContext.Provider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the help menu's items: the studio version row with its
 * version badge, then the sections from the `/help` response as external
 * links separated by dividers. The register-studio row is absent since the
 * test runs in development mode.
 */
describe('ResourcesMenuItems', () => {
  test('renders the version row and resource sections when the studio is outdated', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<ResourcesMenuItemsHarness latestTaggedVersion={new SemVer('5.2.0')} />)

    await expect.element(page.getByTestId('menu-item-studio-version')).toBeVisible()
    await expect.element(page.getByText('Latest version is v5.2.0')).toBeVisible()
    await expect.element(page.getByText('v5.0.0')).toBeVisible()
    await expect.element(page.getByRole('menuitem', {name: 'Documentation'})).toBeVisible()
    await expect.element(page.getByRole('menuitem', {name: 'Sanity Learn'})).toBeVisible()
    await expect.element(page.getByRole('menuitem', {name: 'Join our community'})).toBeVisible()
    await expect.element(page.getByRole('menuitem', {name: 'Help and support'})).toBeVisible()

    await settleChromaticEndState()
  })

  test('renders the up-to-date version row when no newer version is tagged', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<ResourcesMenuItemsHarness />)

    await expect.element(page.getByText('Up to date')).toBeVisible()
    await expect.element(page.getByRole('menuitem', {name: 'Documentation'})).toBeVisible()

    await settleChromaticEndState()
  })
})
