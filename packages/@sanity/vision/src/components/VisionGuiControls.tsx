import {PlayIcon, StopIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Hotkeys, Text, Tooltip} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../i18n'
import {ControlsContainer} from './VisionGui.styled'

export interface VisionGuiControlsProps {
  hasValidParams: boolean
  queryInProgress: boolean
  listenInProgress: boolean
  onQueryExecution: () => void
  onListenExecution: () => void
}

/**
 * Vision GUI controls
 * To handle query and listen execution.
 */
export function VisionGuiControls({
  hasValidParams,
  listenInProgress,
  queryInProgress,
  onQueryExecution,
  onListenExecution,
}: VisionGuiControlsProps) {
  const {t} = useTranslation(visionLocaleNamespace)

  return (
    <ControlsContainer>
      <Card padding={3} paddingX={3}>
        <Tooltip
          content={
            <Card radius={4}>
              <Text size={1} muted>
                {t('params.error.params-invalid-json')}
              </Text>
            </Card>
          }
          placement="top"
          disabled={hasValidParams}
          portal
        >
          <Flex justify="space-evenly">
            <Box flex={1}>
              <Tooltip
                content={
                  <Card radius={4}>
                    <Hotkeys keys={['Ctrl', 'Enter']} />
                  </Card>
                }
                placement="top"
                portal
              >
                <Button
                  width="fill"
                  onClick={onQueryExecution}
                  type="button"
                  icon={queryInProgress ? StopIcon : PlayIcon}
                  disabled={listenInProgress || !hasValidParams}
                  tone={queryInProgress ? 'positive' : 'primary'}
                  text={queryInProgress ? t('action.query-cancel') : t('action.query-execute')}
                />
              </Tooltip>
            </Box>
            <Box flex={1} marginLeft={3}>
              <Button
                width="fill"
                onClick={onListenExecution}
                type="button"
                icon={listenInProgress ? StopIcon : PlayIcon}
                text={listenInProgress ? t('action.listen-cancel') : t('action.listen-execute')}
                mode="ghost"
                disabled={!hasValidParams}
                tone={listenInProgress ? 'positive' : 'default'}
              />
            </Box>
          </Flex>
        </Tooltip>
      </Card>
    </ControlsContainer>
  )
}
