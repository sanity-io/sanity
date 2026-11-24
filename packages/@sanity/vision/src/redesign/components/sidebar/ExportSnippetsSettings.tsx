import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {RestoreIcon} from '@sanity/icons/Restore'
import {Button, Card, Stack} from '@sanity/ui'
import {dequal} from 'dequal/lite'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VisionExportSnippetId} from '../../store/types'
import {useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {EXPORT_SNIPPET_IDS} from '../../store/visionStorage'
import {EXPORT_SNIPPET_TITLES} from '../../util/exportSnippets'
import {SwitchField} from '../SwitchField'
import * as sidebarStyles from './sidebar.module.css'

function move(order: VisionExportSnippetId[], index: number, offset: -1 | 1) {
  const next = [...order]
  const [id] = next.splice(index, 1)
  next.splice(index + offset, 0, id)
  return next
}

/** Which snippets the Export query dialog shows, and the order of its tabs */
export function ExportSnippetsSettings() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const {order, hidden} = useVisionSelector((snapshot) => snapshot.context.exportSnippets)
  const visibleCount = order.length - hidden.length
  const isDefault = dequal(order, EXPORT_SNIPPET_IDS) && hidden.length === 0

  return (
    <Card border data-testid="vision-settings-export-snippets" padding={3} radius={2}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium" as="div" trim={true}>
            {t('vision.settings.export-snippets.title')}
          </Text>
          <Text muted size={1} as="div" trim={true}>
            {t('vision.settings.export-snippets.description')}
          </Text>
        </Stack>
        <Stack as="ol" gap={3} className={sidebarStyles.plainList}>
          {order.map((id, index) => {
            const visible = !hidden.includes(id)
            const title = EXPORT_SNIPPET_TITLES[id]
            return (
              <Flex alignItems="flex-start" as="li" gap={2} key={id}>
                <Box flexGrow={1}>
                  <SwitchField
                    checked={visible}
                    // The dialog always has a tab to show
                    disabled={visible && visibleCount === 1}
                    onChange={(checked) =>
                      actorRef.send({
                        type: 'exportSnippets.update',
                        settings: {
                          hidden: checked
                            ? hidden.filter((hiddenId) => hiddenId !== id)
                            : [...hidden, id],
                        },
                      })
                    }
                    testId={`vision-settings-export-snippet-${id}`}
                    title={title}
                  />
                </Box>
                <Flex flexShrink={0} gap={1}>
                  <Button
                    aria-label={t('vision.settings.export-snippets.move-up', {snippet: title})}
                    className={sidebarStyles.pressable}
                    data-testid={`vision-settings-export-snippet-${id}-up`}
                    disabled={index === 0}
                    fontSize={1}
                    icon={ArrowUpIcon}
                    mode="bleed"
                    onClick={() =>
                      actorRef.send({
                        type: 'exportSnippets.update',
                        settings: {order: move(order, index, -1)},
                      })
                    }
                    padding={2}
                  />
                  <Button
                    aria-label={t('vision.settings.export-snippets.move-down', {snippet: title})}
                    className={sidebarStyles.pressable}
                    data-testid={`vision-settings-export-snippet-${id}-down`}
                    disabled={index === order.length - 1}
                    fontSize={1}
                    icon={ArrowDownIcon}
                    mode="bleed"
                    onClick={() =>
                      actorRef.send({
                        type: 'exportSnippets.update',
                        settings: {order: move(order, index, 1)},
                      })
                    }
                    padding={2}
                  />
                </Flex>
              </Flex>
            )
          })}
        </Stack>
        <Flex>
          <Button
            data-testid="vision-settings-export-snippets-reset"
            disabled={isDefault}
            fontSize={1}
            icon={RestoreIcon}
            mode="ghost"
            onClick={() =>
              actorRef.send({
                type: 'exportSnippets.update',
                settings: {order: [...EXPORT_SNIPPET_IDS], hidden: []},
              })
            }
            padding={2}
            text={t('vision.settings.export-snippets.reset')}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
