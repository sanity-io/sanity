import {CloseIcon} from '@sanity/icons/Close'
import {CollapseIcon} from '@sanity/icons/Collapse'
import {ExpandIcon} from '@sanity/icons/Expand'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'
import {type ContributedDocumentTool, useTranslation} from 'sanity'

import {Button} from '../../../ui-components/button/Button'
import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../i18n'
import {useResolvedPanesList} from '../../structureResolvers/useResolvedPanesList'
import {useStructureTool} from '../../useStructureTool'
import {
  DocumentPaneCollapsed,
  DocumentPaneMaximized,
} from './documentPanel/header/__telemetry__/focus.telemetry'
import {useDocumentPane} from './useDocumentPane'

function SplitPaneButton() {
  const {onPaneSplit} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Button
      aria-label={t('buttons.split-pane-button.aria-label')}
      icon={SplitVerticalIcon}
      mode="bleed"
      onClick={onPaneSplit}
      tooltipProps={{content: t('buttons.split-pane-button.tooltip')}}
    />
  )
}

function FocusModeButton() {
  const {documentId, onSetMaximizedPane} = useDocumentPane()
  const {maximizedPane} = useResolvedPanesList()
  const telemetry = useTelemetry()
  const {t} = useTranslation(structureLocaleNamespace)

  const isMaximizedPane = useMemo(() => {
    return (
      maximizedPane?.pane &&
      typeof maximizedPane.pane === 'object' &&
      maximizedPane.pane.type === 'document' &&
      maximizedPane.pane.options.id === documentId
    )
  }, [maximizedPane, documentId])

  const handleFocusPane = useCallback(() => {
    onSetMaximizedPane?.()

    if (isMaximizedPane) {
      telemetry.log(DocumentPaneCollapsed)
    } else {
      telemetry.log(DocumentPaneMaximized)
    }
  }, [onSetMaximizedPane, isMaximizedPane, telemetry])

  return (
    <Button
      aria-label={
        isMaximizedPane
          ? t('buttons.focus-pane-button.aria-label.collapse')
          : t('buttons.focus-pane-button.aria-label.focus')
      }
      icon={isMaximizedPane ? CollapseIcon : ExpandIcon}
      mode="bleed"
      onClick={handleFocusPane}
      tooltipProps={{
        content: isMaximizedPane
          ? t('buttons.focus-pane-button.tooltip.collapse')
          : t('buttons.focus-pane-button.tooltip.focus'),
      }}
      data-testid={isMaximizedPane ? 'focus-pane-button-collapse' : 'focus-pane-button-focus'}
    />
  )
}

function ClosePaneButton() {
  const {onPaneClose} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Button
      icon={CloseIcon}
      mode="bleed"
      onClick={onPaneClose}
      tooltipProps={{content: t('buttons.split-pane-close-button.title')}}
    />
  )
}

function ClosePaneGroupButton() {
  const {BackLink} = usePaneRouter()
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Button
      as={BackLink}
      icon={CloseIcon}
      mode="bleed"
      tooltipProps={{content: t('buttons.split-pane-close-group-button.title')}}
    />
  )
}

/**
 * The header tools the structure tool contributes to the document form, gated by what this host
 * can actually do. Capability gating happens here, before config sees the tool: `document.tools`
 * vetoes what a host contributes, it never grants what a host cannot offer.
 *
 * @internal
 */
export function useStructureTools(): ContributedDocumentTool[] {
  const {features} = useStructureTool()
  const {onPaneSplit, onSetMaximizedPane, views} = useDocumentPane()
  const {index, BackLink, hasGroupSiblings} = usePaneRouter()

  // there are three kinds of buttons possible:
  //
  // 1. split pane - creates a new split pane
  // 2. close split pane — closes the current split pane
  // 3. close pane group — closes the current pane group

  // show the split pane button if they're enabled and there is more than one
  // view available to use to create a split view
  const showSplitPaneButton = features.splitViews && onPaneSplit && views.length > 1

  // show the split pane button close button if the split button is showing
  // and there is more than one split pane open (aka has-siblings)
  const showSplitPaneCloseButton = showSplitPaneButton && hasGroupSiblings

  // show the back button if both the feature is enabled and the current pane
  // is not the first
  const showBackButton = features.backButton && index > 0

  // show the pane group close button if the `showSplitPaneCloseButton` is
  // _not_ showing (the split pane button replaces the group close button)
  // and if the back button is not showing (the back button and the close
  // button do the same thing and shouldn't be shown at the same time)
  // and if a BackLink component was provided
  const showPaneGroupCloseButton = !showSplitPaneCloseButton && !showBackButton && !!BackLink

  // focus mode toggles this pane against its siblings, so only a host that lays panes out supplies it
  const showFocusModeButton = Boolean(onSetMaximizedPane)

  return useMemo(() => {
    const tools: ContributedDocumentTool[] = []

    if (showSplitPaneButton) {
      tools.push({id: 'splitPane', placement: 'header', render: SplitPaneButton})
    }
    if (showFocusModeButton) {
      tools.push({id: 'focusMode', placement: 'header', render: FocusModeButton})
    }
    if (showSplitPaneCloseButton) {
      tools.push({id: 'closePane', placement: 'header', render: ClosePaneButton})
    }
    if (showPaneGroupCloseButton) {
      tools.push({id: 'closePaneGroup', placement: 'header', render: ClosePaneGroupButton})
    }

    return tools
  }, [showSplitPaneButton, showFocusModeButton, showSplitPaneCloseButton, showPaneGroupCloseButton])
}
