import {SanityDocument} from '@sanity/types'
import {Card, Code, Flex, TabList, TabPanel} from '@sanity/ui'
import React, {useCallback} from 'react'
import JSONInspector from '@rexxars/react-json-inspector'
import {Dialog, Tab} from '../../../../ui-components'
import {DocTitle} from '../../../components'
import {useStructureToolSetting} from '../../../useStructureToolSetting'
import {structureLocaleNamespace} from '../../../i18n'
import {useDocumentPane} from '../useDocumentPane'
import {VIEW_MODE_PARSED, VIEW_MODE_RAW, VIEW_MODES} from './constants'
import {isDocumentLike, isExpanded, maybeSelectAll, select, toggleExpanded} from './helpers'
import {JSONInspectorWrapper} from './InspectDialog.styles'
import {Search} from './Search'
import {Translate, useTranslation} from 'sanity'

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
  const [viewModeId, onViewModeChange] = useStructureToolSetting(
    'structure-tool',
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

  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Dialog
      bodyHeight="fill"
      id={`${dialogIdPrefix}dialog`}
      header={
        isDocumentLike(value) ? (
          <Translate
            t={t}
            i18nKey="document-inspector.dialog.title"
            components={{
              DocumentTitle: () => (
                <em>
                  <DocTitle document={value} />
                </em>
              ),
            }}
          />
        ) : (
          <em>{t('document-inspector.dialog.title-no-value')}</em>
        )
      }
      onClose={onInspectClose}
      onClickOutside={onInspectClose}
      padding={false}
      width={2}
    >
      <Flex direction="column" height="fill">
        <Card
          padding={3}
          paddingTop={0}
          shadow={1}
          style={{position: 'sticky', bottom: 0, zIndex: 3}}
        >
          <TabList space={1}>
            <Tab
              aria-controls={`${dialogIdPrefix}tabpanel`}
              id={`${dialogIdPrefix}tab-${VIEW_MODE_PARSED.id}`}
              label={t(VIEW_MODE_PARSED.title)}
              onClick={setParsedViewMode}
              selected={viewMode === VIEW_MODE_PARSED}
            />
            <Tab
              aria-controls={`${dialogIdPrefix}tabpanel`}
              id={`${dialogIdPrefix}tab-${VIEW_MODE_RAW.id}`}
              label={t(VIEW_MODE_RAW.title)}
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
              size={1}
            >
              {JSON.stringify(value, null, 2)}
            </Code>
          )}
        </TabPanel>
      </Flex>
    </Dialog>
  )
}
