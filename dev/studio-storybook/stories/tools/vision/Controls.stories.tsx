import {Card, Stack} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ChangeEvent, useRef, useState} from 'react'

// Real component from real source (org contract §8): the Vision tool header — the
// dataset / API-version / perspective selectors and the query-URL copy field, mounted
// unmodified. Local state makes the selectors live so the rendered value tracks a choice.
import {DEFAULT_API_VERSION} from '../../../../../packages/@sanity/vision/src/apiVersions'
import {VisionGuiHeader} from '../../../../../packages/@sanity/vision/src/components/VisionGuiHeader'
import {
  isSupportedPerspective,
  type SupportedPerspective,
} from '../../../../../packages/@sanity/vision/src/perspectives'
import {createMockVisionClient} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {AuditNote, VISION_DATASET, visionSchemaTypes} from '../../../lib/visionStoryKit'

const DATASETS = [VISION_DATASET, 'production', 'staging']
const SAMPLE_URL = `https://mock-project-id.api.sanity.io/${DEFAULT_API_VERSION}/data/query/${VISION_DATASET}?query=*%5B_type%20%3D%3D%20%22book%22%5D`

/**
 * A live wrapper around the real `VisionGuiHeader`: the three selectors and the custom
 * API-version input drive local state, so changing a dropdown updates what the header
 * shows, the same wiring `VisionGui` does, minus the query it would trigger.
 */
function ControlsDemo(props: {withUrl?: boolean; startCustom?: boolean}) {
  const [dataset, setDataset] = useState(VISION_DATASET)
  const [apiVersion, setApiVersion] = useState(DEFAULT_API_VERSION)
  const [customApiVersion, setCustomApiVersion] = useState<string | false>(
    props.startCustom ? 'v2019-01-29' : false,
  )
  const [perspective, setPerspective] = useState<SupportedPerspective>('raw')
  const customRef = useRef<HTMLInputElement | null>(null)
  const isValidApiVersion = customApiVersion ? /^v\d{4}-\d{2}-\d{2}$/.test(customApiVersion) : true

  return (
    <VisionGuiHeader
      dataset={dataset}
      datasets={DATASETS}
      onChangeDataset={(e: ChangeEvent<HTMLSelectElement>) => setDataset(e.target.value)}
      apiVersion={apiVersion}
      customApiVersion={customApiVersion}
      onChangeApiVersion={(e: ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value.toLowerCase() === 'other') {
          setCustomApiVersion('v')
          customRef.current?.focus()
          return
        }
        setApiVersion(e.target.value)
        setCustomApiVersion(false)
      }}
      customApiVersionElementRef={customRef}
      onCustomApiVersionChange={(e: ChangeEvent<HTMLInputElement>) =>
        setCustomApiVersion(e.target.value || 'v')
      }
      isValidApiVersion={isValidApiVersion}
      onChangePerspective={(e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        if (isSupportedPerspective(value)) setPerspective(value)
      }}
      perspective={perspective}
      url={props.withUrl ? SAMPLE_URL : undefined}
      isScheduledDraftsEnabled={false}
    />
  )
}

const meta: Meta = {
  title: 'Lists & Data/Vision/Controls',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Controls is the strip across the top of Vision: the Dataset, API version, and ' +
            'Perspective selectors. Perspective is the one that changes what a query returns: ' +
            'raw, published, and drafts return different content for the same query, so a result ' +
            'that looks wrong is often just the wrong perspective selected.',
          '',
          '|        |                                                                                                                                                                                                        |',
          '| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source | `packages/@sanity/vision/src/components/VisionGuiHeader`, the strip across the top of the tool: the Dataset, API version, and Perspective selectors, plus the read-only query URL with its copy button |',
          '| Tier   | SERVICE. Every selector is the real `@sanity/ui` `Select`, live; the API-version select carries an "Other…" option with real validation                                                                |',
          '',
          'Change any selector and the header updates. The API-version select carries an Other… ' +
            'option that swaps in a free-text input with real validation (`v` + a date), so it ' +
            'can target an unreleased API day. The perspective control sits beside an info ' +
            'popover explaining `raw` / `published` / `drafts`. The query URL only appears once a ' +
            'query has run; its copy link writes the exact request to the clipboard.',
          '',
          '> **Why it matters:** whichever perspective is selected gets baked into the copied ' +
            'query URL, so sharing a link also shares an assumption about which content it reads.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: visionSchemaTypes}},
      client: createMockVisionClient(),
    }),
  ],
  tags: ['autodocs', 'chapter:data', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

/** The three selectors, live. Change dataset, API version, or perspective. */
export const Selectors: Story = {
  name: 'Selectors (dataset / API / perspective)',
  render: () => (
    <Card padding={3}>
      <ControlsDemo />
    </Card>
  ),
}

/**
 * The **Other…** API version path: a free-text input with live validation. Type a valid
 * `vYYYY-MM-DD` (accepted) or anything else (the field goes invalid) to see the real
 * validation the tool applies before a request can be built.
 */
export const CustomApiVersion: Story = {
  name: 'Custom API version (validated input)',
  render: () => (
    <Card padding={3}>
      <ControlsDemo startCustom />
    </Card>
  ),
}

/** With a resolved query URL: the read-only URL field and the copy-to-clipboard affordance. */
export const WithQueryUrl: Story = {
  name: 'With query URL (copy affordance)',
  render: () => (
    <Card padding={3}>
      <Stack gap={3}>
        <ControlsDemo withUrl />
        <AuditNote tone="positive">
          The URL is the actual request the tool would send. Copying it gives a shareable, runnable
          Content Lake query, the tool's quiet export path.
        </AuditNote>
      </Stack>
    </Card>
  ),
}
