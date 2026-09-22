import {AddIcon} from '@sanity/icons/Add'
import {CloseIcon} from '@sanity/icons/Close'
import {Badge, Button, TextInput} from '@sanity/ui'
import {type KeyboardEvent, type MouseEvent, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaTab} from '../../store/types'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {deriveTabTitle} from '../../util/tabTitle'
import {tab as tabStyle, tabBar, tabCloseButton, tabTitleButton, tabTitleInput} from '../vista.css'

export function getTabTitle(tab: VistaTab, fallback: string): string {
  return tab.title || deriveTabTitle(tab.query) || fallback
}

interface TabHandleProps {
  tab: VistaTab
  selected: boolean
  editing: boolean
  onSelect: () => void
  onClose: () => void
  onStartRename: () => void
  onRename: (title: string) => void
  onCancelRename: () => void
}

function TabHandle(props: TabHandleProps) {
  const {tab, selected, editing, onSelect, onClose, onStartRename, onRename, onCancelRename} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const title = getTabTitle(tab, t('vista.tabs.untitled'))
  const [draft, setDraft] = useState(title)

  const handleAuxClick = useCallback(
    (event: MouseEvent) => {
      // Middle click closes the tab, as browsers do
      if (event.button === 1) {
        event.preventDefault()
        onClose()
      }
    },
    [onClose],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onRename(draft)
      } else if (event.key === 'Escape') {
        onCancelRename()
      }
    },
    [draft, onCancelRename, onRename],
  )

  return (
    <Flex
      alignItems="center"
      aria-selected={selected}
      className={tabStyle}
      data-testid="vista-tab"
      gap={1}
      paddingLeft={1}
      paddingRight={1}
      role="tab"
    >
      {editing ? (
        <Box className={tabTitleInput} paddingY={1}>
          <TextInput
            autoFocus
            data-testid="vista-tab-title-input"
            fontSize={1}
            onBlur={() => onRename(draft)}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={handleKeyDown}
            padding={2}
            placeholder={t('vista.tabs.title-placeholder')}
            value={draft}
          />
        </Box>
      ) : (
        <Button
          className={tabTitleButton}
          data-testid="vista-tab-button"
          fontSize={1}
          mode="bleed"
          onAuxClick={handleAuxClick}
          onClick={onSelect}
          onDoubleClick={onStartRename}
          padding={2}
          text={title}
          textWeight={selected ? 'medium' : 'regular'}
        />
      )}
      {tab.autoRefetch && (
        <Box flexShrink={0}>
          <Badge fontSize={0} tone="positive">
            {t('vista.live.active')}
          </Badge>
        </Box>
      )}
      <Button
        aria-label={t('vista.tabs.close-tab')}
        className={tabCloseButton}
        data-testid="vista-tab-close"
        fontSize={1}
        icon={CloseIcon}
        mode="bleed"
        onClick={onClose}
        padding={1}
      />
    </Flex>
  )
}

export function QueryTabBar() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const tabs = useVistaSelector((snapshot) => snapshot.context.tabs)
  const activeTabId = useVistaSelector((snapshot) => snapshot.context.activeTabId)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <Flex
      alignItems="stretch"
      borderBottom
      className={tabBar}
      data-testid="vista-tab-bar"
      flexShrink={0}
      paddingX={1}
    >
      <Flex alignItems="stretch" aria-label={t('vista.tabs.label')} role="tablist">
        {tabs.map((tab) => (
          <TabHandle
            editing={editingId === tab.id}
            key={tab.id}
            onCancelRename={() => setEditingId(null)}
            onClose={() => actorRef.send({type: 'tab.close', id: tab.id})}
            onRename={(title) => {
              setEditingId(null)
              actorRef.send({type: 'tab.rename', id: tab.id, title})
            }}
            onSelect={() => actorRef.send({type: 'tab.select', id: tab.id})}
            onStartRename={() => setEditingId(tab.id)}
            selected={tab.id === activeTabId}
            tab={tab}
          />
        ))}
      </Flex>
      <Flex alignItems="center" paddingX={1}>
        <Button
          aria-label={t('vista.tabs.new-tab')}
          data-testid="vista-new-tab"
          fontSize={1}
          icon={AddIcon}
          mode="bleed"
          onClick={() => actorRef.send({type: 'tab.add'})}
          padding={2}
        />
      </Flex>
    </Flex>
  )
}
