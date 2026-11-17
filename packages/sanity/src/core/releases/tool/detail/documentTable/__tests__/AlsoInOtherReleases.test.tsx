import {render, screen, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {
  activeASAPRelease,
  activeCardinalityOneRelease,
} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {AlsoInOtherReleases} from '../AlsoInOtherReleases'

const resources = [studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]

describe('AlsoInOtherReleases', () => {
  it('renders nothing when the document is in no other release', async () => {
    const wrapper = await createTestProvider({resources})
    render(<AlsoInOtherReleases documentId="doc1" otherReleases={[]} />, {wrapper})
    expect(screen.queryByTestId('also-in-other-releases-doc1')).not.toBeInTheDocument()
  })

  it('says how many other releases, and lists them as links', async () => {
    const wrapper = await createTestProvider({resources})
    render(
      <AlsoInOtherReleases
        documentId="doc1"
        otherReleases={[
          activeASAPRelease,
          {
            ...activeCardinalityOneRelease,
            metadata: {...activeCardinalityOneRelease.metadata, title: ''},
          },
        ]}
      />,
      {wrapper},
    )

    const button = screen.getByRole('button', {name: 'Also in 2 other releases'})
    await userEvent.click(button)

    expect(
      screen.getByText('The release that runs last overwrites the others.'),
    ).toBeInTheDocument()
    // The popover is still animating in jsdom, so its menu counts as hidden to role queries.
    const [menu] = await screen.findAllByRole('menu', {hidden: true})
    const links = within(menu).getAllByRole('menuitem', {hidden: true})
    expect(links.map((link) => link.textContent)).toEqual([
      activeASAPRelease.metadata.title,
      'Scheduled draft',
    ])
    expect(links[0].tagName).toBe('A')
  })

  it('uses the singular for one other release', async () => {
    const wrapper = await createTestProvider({resources})
    render(<AlsoInOtherReleases documentId="doc1" otherReleases={[activeASAPRelease]} />, {
      wrapper,
    })
    expect(screen.getByRole('button', {name: 'Also in 1 other release'})).toBeInTheDocument()
  })
})
