import {type PortableTextBlock} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {
  DocumentLimitUpsellContext,
  type DocumentLimitUpsellContextValue,
  ReleasesUpsellContext,
  SingleDocReleaseEnabledContext,
  type SingleDocReleaseEnabledContextValue,
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
  TasksUpsellContext,
} from 'sanity/_singletons'
import {Flex, VStack} from 'ui5'

import {DocumentLimitsUpsellPanel} from '../../../limits/context/documents/DocumentLimitsUpsellPanel'
import {type ReleasesUpsellContextValue} from '../../../releases/contexts/upsell/types'
import {SchedulesUpsell} from '../../../releases/tool/overview/SchedulesUpsell'
import {TasksUpsellPanel} from '../../../tasks/components/upsell/TasksUpsellPanel'
import {type TasksUpsellContextValue} from '../../../tasks/context/upsell/types'
import {type UpsellData} from '../types'

function upsellData(id: string, title: string, body: string): UpsellData {
  const descriptionText: PortableTextBlock[] = [
    {
      _type: 'block',
      _key: `${id}-title`,
      style: 'h2',
      children: [{_type: 'span', _key: `${id}-title-span`, marks: [], text: title}],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: `${id}-body`,
      style: 'normal',
      children: [{_type: 'span', _key: `${id}-body-span`, marks: [], text: body}],
      markDefs: [],
    },
  ]

  return {
    _createdAt: '2024-01-01T00:00:00.000Z',
    _id: id,
    _rev: '1',
    _type: 'upsell',
    _updatedAt: '2024-01-01T00:00:00.000Z',
    ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/pricing'},
    descriptionText,
    id,
    image: null,
    secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
  }
}

const TELEMETRY_LOGS = {
  dialogSecondaryClicked: noop,
  dialogPrimaryClicked: noop,
  panelViewed: noop,
  panelDismissed: noop,
  panelPrimaryClicked: noop,
  panelSecondaryClicked: noop,
}

const TASKS: TasksUpsellContextValue = {
  upsellDialogOpen: false,
  handleOpenDialog: noop,
  handleClose: noop,
  upsellData: upsellData(
    'upsell-tasks',
    'Unlock Tasks',
    'Assign work, track progress and discuss documents without leaving the Studio.',
  ),
  telemetryLogs: TELEMETRY_LOGS,
}

const DOCUMENT_LIMIT: DocumentLimitUpsellContextValue = {
  upsellDialogOpen: false,
  handleOpenDialog: noop,
  handleClose: noop,
  upsellData: upsellData(
    'upsell-document-limit',
    'Document limit reached',
    'This dataset has reached the document limit of your plan. Upgrade to keep creating content.',
  ),
  telemetryLogs: TELEMETRY_LOGS,
}

const RELEASES: ReleasesUpsellContextValue = {
  mode: 'upsell',
  upsellDialogOpen: false,
  upsellData: upsellData(
    'upsell-releases',
    'Unlock content releases',
    'Schedule and publish groups of documents together.',
  ),
  guardWithReleaseLimitUpsell: async () => undefined,
  onReleaseLimitReached: noop,
  handleOpenDialog: noop,
  telemetryLogs: TELEMETRY_LOGS,
}

const SCHEDULED_DRAFTS_ENABLED: SingleDocReleaseEnabledContextValue = {
  enabled: true,
  mode: 'upsell',
}

const SCHEDULED_DRAFTS: SingleDocReleaseUpsellContextValue = {
  upsellDialogOpen: false,
  handleOpenDialog: noop,
  handleClose: noop,
  upsellData: upsellData(
    'upsell-scheduled-drafts',
    'Unlock scheduled drafts',
    'Pick a date and time and let the Studio publish the draft for you.',
  ),
  telemetryLogs: TELEMETRY_LOGS,
}

const FULL_HEIGHT_FRAME = {height: 360}
const OVERVIEW_FRAME = {height: 520}

/**
 * Chromatic sentinel for the production hosts of `UpsellPanel`, ahead of the
 * `@sanity/ui` to `ui5` Container migration (`width` becomes `size`). Each
 * host is the Container that decides how wide the panel paints: the tasks
 * sidebar panel (Container 1 with a bottom margin), the document-limit error
 * screen (Container 0 centered in a full-height Flex) and the releases
 * overview empty state for both cardinality views (a `styled(Container)`
 * that overrides the width to `auto` and adds `flex-shrink: 0` under the
 * release illustration). Frames mirror the sidebar column, the document pane
 * and the overview column so the Flex centering has room to act. Context
 * values are static fixtures with no-op telemetry, so nothing is fetched and
 * no dialog mounts.
 */
export function UpsellPanelHostsStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            tasks sidebar
          </Text>
          <TasksUpsellContext.Provider value={TASKS}>
            <Flex flexDirection="column" padding={3} paddingTop={4} paddingX={4}>
              <TasksUpsellPanel />
            </Flex>
          </TasksUpsellContext.Provider>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            document limit reached
          </Text>
          <DocumentLimitUpsellContext.Provider value={DOCUMENT_LIMIT}>
            <div style={FULL_HEIGHT_FRAME}>
              <DocumentLimitsUpsellPanel />
            </div>
          </DocumentLimitUpsellContext.Provider>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            releases overview, releases view
          </Text>
          <ReleasesUpsellContext.Provider value={RELEASES}>
            <Flex flexDirection="column" style={OVERVIEW_FRAME}>
              <SchedulesUpsell cardinalityView="releases" />
            </Flex>
          </ReleasesUpsellContext.Provider>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            releases overview, scheduled drafts view
          </Text>
          <SingleDocReleaseEnabledContext.Provider value={SCHEDULED_DRAFTS_ENABLED}>
            <SingleDocReleaseUpsellContext.Provider value={SCHEDULED_DRAFTS}>
              <Flex flexDirection="column" style={OVERVIEW_FRAME}>
                <SchedulesUpsell cardinalityView="drafts" />
              </Flex>
            </SingleDocReleaseUpsellContext.Provider>
          </SingleDocReleaseEnabledContext.Provider>
        </VStack>
      </VStack>
    </Card>
  )
}
