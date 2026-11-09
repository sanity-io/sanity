import {type PortableTextBlock} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps} from 'react'
import {Text, VStack} from 'ui5'

import {type UpsellData, type UpsellDataResult} from '../types'
import {UpsellPanel} from '../UpsellPanel'

const DESCRIPTION: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'title',
    style: 'h2',
    children: [{_type: 'span', _key: 'title-span', marks: [], text: 'Unlock content releases'}],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'body',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'body-span',
        marks: [],
        text: 'Schedule and publish groups of documents together.',
      },
    ],
    markDefs: [],
  },
]

const UPSELL_DATA: UpsellData = {
  _createdAt: '2024-01-01T00:00:00.000Z',
  _id: 'upsell-releases',
  _rev: '1',
  _type: 'upsell',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  ctaButton: {text: 'Upgrade', url: 'https://www.sanity.io/pricing'},
  descriptionText: DESCRIPTION,
  id: 'upsell-releases',
  image: null,
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}

// Inline SVG data URI: keeps the story network-free while lighting up the
// `_responsive` 50%-width image branch the horizontal layout depends on.
const FIXTURE_IMAGE: UpsellData['image'] = {
  asset: {
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23e3e4e8'/%3E%3C/svg%3E",
    altText: 'Fixture illustration',
  },
}

// What a provider's context reads as once its request has answered. Settled in
// place so `use()` returns synchronously and the panel never suspends.
function settled(data: UpsellData): ComponentProps<typeof UpsellPanel>['upsell'] {
  const value: UpsellDataResult = {upsellData: data, hasError: false}
  return {
    upsellDataPromise: Object.assign(Promise.resolve(value), {status: 'fulfilled' as const, value}),
    requestUpsellData: noop,
    telemetryLogs: {panelPrimaryClicked: noop, panelSecondaryClicked: noop},
  }
}

const UPSELL = settled(UPSELL_DATA)
const UPSELL_WITH_IMAGE = settled({...UPSELL_DATA, image: FIXTURE_IMAGE})

/**
 * Chromatic sentinel for the shared upsell card after the ui5 Box migration.
 * Vertical vs horizontal layout, bordered vs flush, and start vs center
 * alignment all depend on Box padding around Portable Text — a spacing
 * drift TypeScript will not catch. The horizontal state carries an image
 * because production's only horizontal caller (scheduled-publishing
 * Schedules) always has one; the flush centered state mirrors the imageless
 * releases SchedulesUpsell. Copy is a fixture (no network).
 */
export function UpsellPanelStory() {
  return (
    <Card padding={4} style={{maxWidth: 560}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            vertical bordered
          </Text>
          <UpsellPanel upsell={UPSELL} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            horizontal bordered (image left, copy right)
          </Text>
          <UpsellPanel layout="horizontal" upsell={UPSELL_WITH_IMAGE} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            vertical flush centered
          </Text>
          <UpsellPanel align="center" border={false} upsell={UPSELL} />
        </VStack>
      </VStack>
    </Card>
  )
}
