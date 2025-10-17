import {Box, Text} from '@sanity/ui'
import {isRecord, Translate, useTranslation} from 'sanity'

import {Pane} from '../../components/pane/Pane'
import {PaneContent} from '../../components/pane/PaneContent'
import {PaneHeader} from '../../components/pane/PaneHeader'
import {structureLocaleNamespace} from '../../i18n'

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
  const {t} = useTranslation(structureLocaleNamespace)
  return (
    <Pane id={paneKey} selected={isSelected}>
      <PaneHeader title={t('panes.unknown-pane-type.title')} />
      <PaneContent>
        <Box padding={4}>
          {typeof type === 'string' ? (
            <Text as="p" muted>
              <Translate
                t={t}
                i18nKey="panes.unknown-pane-type.unknown-type.text"
                values={{type}}
              />
            </Text>
          ) : (
            <Text as="p" muted>
              <Translate t={t} i18nKey="panes.unknown-pane-type.missing-type.text" />
            </Text>
          )}
        </Box>
      </PaneContent>
    </Pane>
  )
}
