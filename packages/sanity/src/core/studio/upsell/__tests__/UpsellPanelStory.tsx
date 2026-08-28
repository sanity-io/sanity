import {type PortableTextBlock} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'

import {type UpsellData} from '../types'
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

const NOOP = () => undefined

/**
 * Chromatic sentinel for the shared upsell card after the ui5 Box migration.
 * Vertical vs horizontal layout, bordered vs flush, and start vs center
 * alignment all depend on Box padding around Portable Text — a spacing
 * drift TypeScript will not catch. Copy is a fixture (no image fetch).
 */
export function UpsellPanelStory() {
  return (
    <Card padding={4} style={{maxWidth: 560}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            vertical bordered
          </Text>
          <UpsellPanel data={UPSELL_DATA} onPrimaryClick={NOOP} onSecondaryClick={NOOP} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            horizontal bordered
          </Text>
          <UpsellPanel
            data={UPSELL_DATA}
            layout="horizontal"
            onPrimaryClick={NOOP}
            onSecondaryClick={NOOP}
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            vertical flush centered
          </Text>
          <UpsellPanel
            align="center"
            border={false}
            data={UPSELL_DATA}
            onPrimaryClick={NOOP}
            onSecondaryClick={NOOP}
          />
        </Stack>
      </Stack>
    </Card>
  )
}
