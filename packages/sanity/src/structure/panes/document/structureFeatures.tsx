import {CloseIcon} from '@sanity/icons/Close'
import {CollapseIcon} from '@sanity/icons/Collapse'
import {ExpandIcon} from '@sanity/icons/Expand'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'
import {type DocumentFeature, useTranslation} from 'sanity'

import {Button} from '../../../ui-components/button/Button'
import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../i18n'
import {type View} from '../../structureBuilder/types'
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
 * The header features the structure tool contributes to the document form, gated by what this host
 * can actually do. Capability gating happens here, before config sees the feature:
 * `document.features` vetoes what a host contributes, it never grants what a host cannot offer.
 *
 * @internal
 */
export function useStructureFeatures(options: {
  onPaneSplit?: () => void
  onSetMaximizedPane?: () => void
  views: View[]
}): DocumentFeature[] {
  const {onPaneSplit, onSetMaximizedPane, views} = options
  const {features: structureFeatures} = useStructureTool()
  const {index, BackLink, hasGroupSiblings} = usePaneRouter()

  const showSplitPaneButton = Boolean(
    structureFeatures.splitViews && onPaneSplit && views.length > 1,
  )
  const showSplitPaneCloseButton = showSplitPaneButton && hasGroupSiblings
  const showBackButton = structureFeatures.backButton && index > 0
  // The split pane close button replaces the group close button, and the back button already does
  // what the group close button does, so either one showing withholds it.
  const showPaneGroupCloseButton = !showSplitPaneCloseButton && !showBackButton && Boolean(BackLink)
  // Focus mode toggles this pane against its siblings, so only a host that lays panes out has it
  const showFocusModeButton = Boolean(onSetMaximizedPane)

  return useMemo(() => {
    const features: DocumentFeature[] = []

    if (showSplitPaneButton) {
      features.push({name: 'splitPane', toolbar: {placement: 'header', render: SplitPaneButton}})
    }
    if (showFocusModeButton) {
      features.push({name: 'focusMode', toolbar: {placement: 'header', render: FocusModeButton}})
    }
    if (showSplitPaneCloseButton) {
      features.push({name: 'closePane', toolbar: {placement: 'header', render: ClosePaneButton}})
    }
    if (showPaneGroupCloseButton) {
      features.push({
        name: 'closePaneGroup',
        toolbar: {placement: 'header', render: ClosePaneGroupButton},
      })
    }

    return features
  }, [showSplitPaneButton, showFocusModeButton, showSplitPaneCloseButton, showPaneGroupCloseButton])
}
