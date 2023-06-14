import React from 'react'
import {useBoolean} from '@sanity/ui-workshop'
import {Button, Flex, MenuButton} from '@sanity/ui'
import {HelpCircleIcon} from '@sanity/icons'
import {ResourcesMenu} from '../resources/ResourcesMenu'

export default function HelpResourcesStory() {
  const customLoading = useBoolean('Loading', false, 'Props') || false
  const noItems = useBoolean('Simulate error', false, 'Props') || false
  const error = noItems ? new Error('No items') : null

  return (
    <Flex justify="center" align="center" paddingTop={3}>
      <MenuButton
        button={<Button icon={HelpCircleIcon} mode="bleed" fontSize={2} />}
        id="menu-button-resources"
        menu={<ResourcesMenu value={helpResources} error={error} isLoading={customLoading} />}
        placement="bottom"
        popover={{constrainSize: true, portal: true}}
      />
    </Flex>
  )
}

const helpResources = {
  resources: {
    sectionArray: [
      {
        _key: '7d285ab64dbd',
        items: [
          {
            _type: 'externalLink' as const,
            _key: '898f8a336805',
            title: 'Documentation',
            url: 'https://www.sanity.io/docs',
          },
          {
            title: 'Changelog',
            url: 'https://www.sanity.io/changelog',
            _type: 'externalLink' as const,
            _key: 'b7ec39c2d06b',
          },
        ],
        sectionTitle: 'Developer resources',
      },
      {
        sectionTitle: 'Get in touch',
        _type: 'sectionItems',
        _key: '59aa78571dab',
        items: [
          {
            url: 'https://www.sanity.io/exchange/community ',
            _type: 'externalLink' as const,
            _key: 'ab179b74a3fe',
            title: 'Join our community',
          },
          {
            title: 'Help and support',
            url: 'https://www.sanity.io/contact/support',
            _type: 'externalLink' as const,
            _key: 'ee3c2936ceb2',
          },
          {
            _type: 'externalLink' as const,
            _key: '0723964b5da4',
            title: 'Contact sales',
            url: 'https://www.sanity.io/contact/sales?ref=studio',
          },
        ],
      },
    ],
  },
  welcome: undefined,
  latestVersion: '3.12.0',
}
