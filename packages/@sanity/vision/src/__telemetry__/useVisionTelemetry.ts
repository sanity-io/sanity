import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'

import {VISION_VERSION} from '../version'
import {
  VisionAgentActionInvoked,
  VisionAiUpsellOpened,
  VisionApiVersionChanged,
  VisionClosedTabsSearched,
  VisionClosedTabUsed,
  VisionCopied,
  VisionDatasetChanged,
  VisionDeltaLoaded,
  VisionDialogOpened,
  VisionDocumentOpened,
  VisionDrawerOpened,
  VisionFunctionUsed,
  VisionHistoryUsed,
  VisionLintUsed,
  VisionMutateUsed,
  VisionOpened,
  VisionOptionToggled,
  VisionPanelToggled,
  VisionParamsUsed,
  VisionPerspectiveChanged,
  VisionQueryCancelled,
  VisionQueryPlanShown,
  VisionQueryPrettified,
  VisionQueryRun,
  VisionQueryUrlPasted,
  VisionPanelTabOpened,
  VisionResultExported,
  VisionSettingsChanged,
  VisionSharedTabsSearched,
  VisionSharedTabUsed,
  VisionShortcutUsed,
  VisionSnippetCopied,
  VisionTabsChanged,
  VisionTabUsed,
  VisionViewChanged,
  type VisionAgentAction,
  type VisionClosedTabAction,
  type VisionCopyTarget,
  type VisionDialogId,
  type VisionDocumentOpenSource,
  type VisionDrawerId,
  type VisionFunctionAction,
  type VisionHistoryAction,
  type VisionMutateAction,
  type VisionPanel,
  type VisionQueryMode,
  type VisionQueryRunData,
  type VisionPanelTab,
  type VisionResultExportFormat,
  type VisionSettingsSection,
  type VisionSharedTabAction,
  type VisionShortcut,
  type VisionSnippet,
  type VisionTabAction,
  type VisionToggleOption,
  type VisionUi,
  type VisionView,
  type VisionViewTarget,
} from './vision.telemetry'

export interface VisionTelemetry {
  opened: (ui: VisionUi) => void
  queryRun: (data: VisionQueryRunData) => void
  queryCancelled: (mode: VisionQueryMode) => void
  datasetChanged: () => void
  perspectiveChanged: () => void
  apiVersionChanged: (custom: boolean) => void
  copied: (target: VisionCopyTarget) => void
  queryUrlPasted: () => void
  resultExported: (format: VisionResultExportFormat) => void
  documentOpened: (source: VisionDocumentOpenSource) => void
  panelToggled: (panel: VisionPanel, open: boolean) => void
  tabsChanged: (count: number, action: 'open' | 'add' | 'close') => void
  tabUsed: (action: VisionTabAction) => void
  sharedTab: (action: VisionSharedTabAction) => void
  sharedTabsSearched: () => void
  closedTab: (action: VisionClosedTabAction) => void
  closedTabsSearched: () => void
  drawerOpened: (drawer: VisionDrawerId) => void
  dialogOpened: (dialog: VisionDialogId) => void
  panelTabOpened: (tab: VisionPanelTab) => void
  viewChanged: (target: VisionViewTarget, view: VisionView) => void
  optionToggled: (option: VisionToggleOption, enabled: boolean) => void
  settingsChanged: (section: VisionSettingsSection) => void
  shortcutUsed: (shortcut: VisionShortcut) => void
  queryPrettified: (outcome: 'success' | 'error') => void
  lintUsed: (action: 'open' | 'fix') => void
  snippetCopied: (snippet: VisionSnippet) => void
  agentAction: (action: VisionAgentAction) => void
  aiUpsellOpened: () => void
  queryPlanShown: () => void
  historyUsed: (action: VisionHistoryAction) => void
  functionUsed: (action: VisionFunctionAction) => void
  mutateUsed: (action: VisionMutateAction) => void
  deltaLoaded: () => void
}

function withVisionVersion<Data extends object>(data: Data): Data & {visionVersion: string} {
  return {...data, visionVersion: VISION_VERSION}
}

/** Usage events for the Vision tool. See `vision.telemetry.ts`. */
export function useVisionTelemetry(): VisionTelemetry {
  const telemetry = useTelemetry()

  return useMemo(
    (): VisionTelemetry => ({
      opened: (ui) => telemetry.log(VisionOpened, withVisionVersion({ui})),
      queryRun: (data) => {
        telemetry.log(VisionQueryRun, withVisionVersion(data))
        if (data.hasParams) telemetry.log(VisionParamsUsed, withVisionVersion({mode: data.mode}))
      },
      queryCancelled: (mode) => telemetry.log(VisionQueryCancelled, withVisionVersion({mode})),
      datasetChanged: () => telemetry.log(VisionDatasetChanged, withVisionVersion({})),
      perspectiveChanged: () => telemetry.log(VisionPerspectiveChanged, withVisionVersion({})),
      apiVersionChanged: (custom) =>
        telemetry.log(VisionApiVersionChanged, withVisionVersion({custom})),
      copied: (target) => telemetry.log(VisionCopied, withVisionVersion({target})),
      queryUrlPasted: () => telemetry.log(VisionQueryUrlPasted, withVisionVersion({})),
      resultExported: (format) => telemetry.log(VisionResultExported, withVisionVersion({format})),
      documentOpened: (source) => telemetry.log(VisionDocumentOpened, withVisionVersion({source})),
      panelToggled: (panel, open) =>
        telemetry.log(VisionPanelToggled, withVisionVersion({panel, open})),
      tabsChanged: (count, action) =>
        telemetry.log(VisionTabsChanged, withVisionVersion({count, action})),
      tabUsed: (action) => telemetry.log(VisionTabUsed, withVisionVersion({action})),
      sharedTab: (action) => telemetry.log(VisionSharedTabUsed, withVisionVersion({action})),
      sharedTabsSearched: () => telemetry.log(VisionSharedTabsSearched, withVisionVersion({})),
      closedTab: (action) => telemetry.log(VisionClosedTabUsed, withVisionVersion({action})),
      closedTabsSearched: () => telemetry.log(VisionClosedTabsSearched, withVisionVersion({})),
      drawerOpened: (drawer) => telemetry.log(VisionDrawerOpened, withVisionVersion({drawer})),
      dialogOpened: (dialog) => telemetry.log(VisionDialogOpened, withVisionVersion({dialog})),
      panelTabOpened: (tab) => telemetry.log(VisionPanelTabOpened, withVisionVersion({tab})),
      viewChanged: (target, view) =>
        telemetry.log(VisionViewChanged, withVisionVersion({target, view})),
      optionToggled: (option, enabled) =>
        telemetry.log(VisionOptionToggled, withVisionVersion({option, enabled})),
      settingsChanged: (section) =>
        telemetry.log(VisionSettingsChanged, withVisionVersion({section})),
      shortcutUsed: (shortcut) => telemetry.log(VisionShortcutUsed, withVisionVersion({shortcut})),
      queryPrettified: (outcome) =>
        telemetry.log(VisionQueryPrettified, withVisionVersion({outcome})),
      lintUsed: (action) => telemetry.log(VisionLintUsed, withVisionVersion({action})),
      snippetCopied: (snippet) => telemetry.log(VisionSnippetCopied, withVisionVersion({snippet})),
      agentAction: (action) => telemetry.log(VisionAgentActionInvoked, withVisionVersion({action})),
      aiUpsellOpened: () => telemetry.log(VisionAiUpsellOpened, withVisionVersion({})),
      queryPlanShown: () => telemetry.log(VisionQueryPlanShown, withVisionVersion({})),
      historyUsed: (action) => telemetry.log(VisionHistoryUsed, withVisionVersion({action})),
      functionUsed: (action) => telemetry.log(VisionFunctionUsed, withVisionVersion({action})),
      mutateUsed: (action) => telemetry.log(VisionMutateUsed, withVisionVersion({action})),
      deltaLoaded: () => telemetry.log(VisionDeltaLoaded, withVisionVersion({})),
    }),
    [telemetry],
  )
}
