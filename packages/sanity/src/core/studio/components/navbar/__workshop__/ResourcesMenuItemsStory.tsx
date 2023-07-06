import {Card, Flex, Menu} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React from 'react'
import {ResourcesMenuItems} from '../resources/ResourcesMenuItems'

export default function ResourcesMenuItemsStory() {
  const isLoading = useBoolean('Loading', false, 'Props') || false
  const noItems = useBoolean('Error / no items', false, 'Props') || false
  const error = noItems ? new Error() : null

  return (
    <Flex justify="center" align="center" paddingTop={3}>
      <Card radius={2} shadow={1}>
        <Menu>
          <ResourcesMenuItems error={error} isLoading={isLoading} value={helpResources} />
        </Menu>
      </Card>
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
