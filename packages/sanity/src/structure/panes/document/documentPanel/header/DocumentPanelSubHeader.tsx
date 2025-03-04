import {ArrowLeftIcon} from '@sanity/icons'
import {memo, useMemo, useState} from 'react'
import {useTranslation} from 'sanity'

import {Button} from '../../../../../ui-components'
import {PaneHeader, usePane, usePaneRouter} from '../../../../components'
import {structureLocaleNamespace} from '../../../../i18n'
import {useStructureTool} from '../../../../useStructureTool'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'

/**
 * When not collapsed this component will render the title and the tabs.
 * This component will render inside the document panel and not with the DocumentPanelHeader
 */
export const DocumentPanelSubHeader = memo(function DocumentPanelHeader() {
  const {editState, connectionState, views} = useDocumentPane()
  const {features} = useStructureTool()
  const {index, BackLink} = usePaneRouter()
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)

  const showTabs = views.length > 1

  const {collapsed, isLast} = usePane()
  // Prevent focus if this is the last (non-collapsed) pane.
  const tabIndex = isLast && !collapsed ? -1 : 0

  // show the back button if both the feature is enabled and the current pane
  // is not the first
  const showBackButton = features.backButton && index > 0

  const {t} = useTranslation(structureLocaleNamespace)

  const title = useMemo(() => <DocumentHeaderTitle />, [])
  const tabs = useMemo(
    () => showTabs && <DocumentHeaderTabs parentRef={parentRef} />,
    [showTabs, parentRef],
  )

  const backButton = useMemo(
    () =>
      showBackButton && (
        <Button
          as={BackLink}
          data-as="a"
          icon={ArrowLeftIcon}
          mode="bleed"
          tooltipProps={{content: t('pane-header.back-button.text')}}
        />
      ),
    [BackLink, showBackButton, t],
  )

  return (
    <PaneHeader
      ref={setParentRef}
      loading={connectionState === 'connecting' && !editState?.draft && !editState?.published}
      title={title}
      tabs={tabs}
      tabIndex={tabIndex}
      backButton={backButton}
    />
  )
})
