import {SanityDocument} from '@sanity/types'
import {Card, Code, Dialog, Flex, Tab, TabList, TabPanel} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import JSONInspector from '@rexxars/react-json-inspector'
import {DocTitle} from '../../../components'
import {useDeskToolSetting} from '../../../useDeskToolSetting'
import {useDocumentPane} from '../useDocumentPane'
import {VIEW_MODE_PARSED, VIEW_MODE_RAW, VIEW_MODES} from './constants'
import {isDocumentLike, isExpanded, maybeSelectAll, select, toggleExpanded} from './helpers'
import {JSONInspectorWrapper} from './InspectDialog.styles'
import {Search} from './Search'
import {clearAllBodyScrollLocks, disableBodyScroll, enableBodyScroll} from 'sanity'

interface InspectDialogProps {
  value: Partial<SanityDocument> | null
}

export function InspectDialog(props: InspectDialogProps) {
  const {value} = props
  const {onInspectClose, paneKey} = useDocumentPane()
  const dialogIdPrefix = `${paneKey}_inspect_`

  /* this creates a view mode (the default that it opens with is the parsed tab) that is saved based on the paneKey
  where the inspect dialog lives.
  This also means that when a page is loaded, the state of the tabs remains and doesn't revert to the pane tab */
  const [viewModeId, onViewModeChange] = useDeskToolSetting(
    'desk-tool',
    `inspect-view-preferred-view-mode-${paneKey}`,
    'parsed',
  )

  /* based on the view mode it shows the right tab content */
  const viewMode = VIEW_MODES.find((mode) => mode.id === viewModeId)

  const setParsedViewMode = useCallback(() => {
    onViewModeChange(VIEW_MODE_PARSED.id)
  }, [onViewModeChange])

  const setRawViewMode = useCallback(() => {
    onViewModeChange(VIEW_MODE_RAW.id)
  }, [onViewModeChange])

  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)

  //Avoid background of dialog being scrollable on mobile
  //TODO: Won't scroll on close
  if (documentScrollElement) {
    disableBodyScroll(documentScrollElement)
  }

  const onHandleClose = useCallback(() => {
    onInspectClose()
    if (documentScrollElement) {
      enableBodyScroll(documentScrollElement)
    }
  }, [onInspectClose, documentScrollElement])

  return (
    <Dialog
      id={`${dialogIdPrefix}dialog`}
      header={
        isDocumentLike(value) ? (
          <>
            Inspecting{' '}
            <em>
              <DocTitle document={value} />
            </em>
          </>
        ) : (
          <em>No value</em>
        )
      }
      contentRef={setDocumentScrollElement}
      onClose={onHandleClose}
      onClickOutside={onHandleClose}
      width={3}
    >
      <Flex direction="column" height="fill">
        <Card padding={3} shadow={1} style={{position: 'sticky', bottom: 0, zIndex: 3}}>
          <TabList space={1}>
            <Tab
              aria-controls={`${dialogIdPrefix}tabpanel`}
              fontSize={1}
              id={`${dialogIdPrefix}tab-${VIEW_MODE_PARSED.id}`}
              label={VIEW_MODE_PARSED.title}
              onClick={setParsedViewMode}
              selected={viewMode === VIEW_MODE_PARSED}
            />
            <Tab
              aria-controls={`${dialogIdPrefix}tabpanel`}
              fontSize={1}
              id={`${dialogIdPrefix}tab-${VIEW_MODE_RAW.id}`}
              label={VIEW_MODE_RAW.title}
              onClick={setRawViewMode}
              selected={viewMode === VIEW_MODE_RAW}
            />
          </TabList>
        </Card>

        <TabPanel
          aria-labelledby={`${dialogIdPrefix}tab-${viewModeId}`}
          flex={1}
          id={`${dialogIdPrefix}tabpanel`}
          overflow="auto"
          padding={4}
          style={{outline: 'none'}}
        >
          {viewMode === VIEW_MODE_PARSED && (
            <JSONInspectorWrapper>
              <JSONInspector
                data={value}
                isExpanded={isExpanded}
                onClick={toggleExpanded}
                search={Search}
              />
            </JSONInspectorWrapper>
          )}

          {viewMode === VIEW_MODE_RAW && (
            <Code
              language="json"
              tabIndex={0}
              onKeyDown={maybeSelectAll}
              onDoubleClick={select}
              onFocus={select}
            >
              {JSON.stringify(value, null, 2)}
            </Code>
          )}
        </TabPanel>
      </Flex>
    </Dialog>
  )
}
