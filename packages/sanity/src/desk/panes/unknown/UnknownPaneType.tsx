import {Box, Text} from '@sanity/ui'
import React from 'react'
import {Pane, PaneContent, PaneHeader} from '../../components/pane'
import {deskLocaleNamespace} from '../../i18n'
import {isRecord, useTranslation} from 'sanity'

interface UnknownPaneProps {
  isSelected: boolean
  pane: unknown
  paneKey: string
}

/**
 * @internal
 */
export function UnknownPane(props: UnknownPaneProps) {
  const {isSelected, pane, paneKey} = props
  const type = (isRecord(pane) && pane.type) || null
  const {t} = useTranslation(deskLocaleNamespace)

  return (
    <Pane id={paneKey} selected={isSelected}>
      <PaneHeader title="Unknown pane type" />
      <PaneContent>
        <Box padding={4}>
          {typeof type === 'string' ? (
            <Text as="p" muted>
              {t('panes.unknown-pane-type.unknown-type.text', {type: type})}
            </Text>
          ) : (
            <Text as="p" muted>
              {t('panes.unknown-pane-type.missing-type.text')}
            </Text>
          )}
        </Box>
      </PaneContent>
    </Pane>
  )
}
