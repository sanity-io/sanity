import {useTelemetry} from '@sanity/telemetry/react'
import {useMemo} from 'react'

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

/** Usage events for the Vision tool. See `vision.telemetry.ts`. */
export function useVisionTelemetry(): VisionTelemetry {
  const telemetry = useTelemetry()

  return useMemo(
    (): VisionTelemetry => ({
      opened: (ui) => telemetry.log(VisionOpened, {ui}),
      queryRun: (data) => {
        telemetry.log(VisionQueryRun, data)
        if (data.hasParams) telemetry.log(VisionParamsUsed, {mode: data.mode})
      },
      queryCancelled: (mode) => telemetry.log(VisionQueryCancelled, {mode}),
      datasetChanged: () => telemetry.log(VisionDatasetChanged),
      perspectiveChanged: () => telemetry.log(VisionPerspectiveChanged),
      apiVersionChanged: (custom) => telemetry.log(VisionApiVersionChanged, {custom}),
      copied: (target) => telemetry.log(VisionCopied, {target}),
      queryUrlPasted: () => telemetry.log(VisionQueryUrlPasted),
      resultExported: (format) => telemetry.log(VisionResultExported, {format}),
      documentOpened: (source) => telemetry.log(VisionDocumentOpened, {source}),
      panelToggled: (panel, open) => telemetry.log(VisionPanelToggled, {panel, open}),
      tabsChanged: (count, action) => telemetry.log(VisionTabsChanged, {count, action}),
      tabUsed: (action) => telemetry.log(VisionTabUsed, {action}),
      sharedTab: (action) => telemetry.log(VisionSharedTabUsed, {action}),
      sharedTabsSearched: () => telemetry.log(VisionSharedTabsSearched),
      closedTab: (action) => telemetry.log(VisionClosedTabUsed, {action}),
      closedTabsSearched: () => telemetry.log(VisionClosedTabsSearched),
      drawerOpened: (drawer) => telemetry.log(VisionDrawerOpened, {drawer}),
      dialogOpened: (dialog) => telemetry.log(VisionDialogOpened, {dialog}),
      panelTabOpened: (tab) => telemetry.log(VisionPanelTabOpened, {tab}),
      viewChanged: (target, view) => telemetry.log(VisionViewChanged, {target, view}),
      optionToggled: (option, enabled) => telemetry.log(VisionOptionToggled, {option, enabled}),
      settingsChanged: (section) => telemetry.log(VisionSettingsChanged, {section}),
      shortcutUsed: (shortcut) => telemetry.log(VisionShortcutUsed, {shortcut}),
      queryPrettified: (outcome) => telemetry.log(VisionQueryPrettified, {outcome}),
      lintUsed: (action) => telemetry.log(VisionLintUsed, {action}),
      snippetCopied: (snippet) => telemetry.log(VisionSnippetCopied, {snippet}),
      agentAction: (action) => telemetry.log(VisionAgentActionInvoked, {action}),
      aiUpsellOpened: () => telemetry.log(VisionAiUpsellOpened),
      queryPlanShown: () => telemetry.log(VisionQueryPlanShown),
      historyUsed: (action) => telemetry.log(VisionHistoryUsed, {action}),
      functionUsed: (action) => telemetry.log(VisionFunctionUsed, {action}),
      mutateUsed: (action) => telemetry.log(VisionMutateUsed, {action}),
      deltaLoaded: () => telemetry.log(VisionDeltaLoaded),
    }),
    [telemetry],
  )
}
