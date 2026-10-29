import {PlayIcon} from '@sanity/icons/Play'
import {RocketIcon} from '@sanity/icons/Rocket'
import {StopIcon} from '@sanity/icons/Stop'
import {Button, Card, Hotkeys, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useTranslation} from 'sanity'
import {Flex, Box} from 'ui5'

import {visionLocaleNamespace} from '../i18n'
import {ControlsContainer} from './VisionGui.styled'

export interface VisionGuiControlsProps {
  hasValidParams: boolean
  queryInProgress: boolean
  listenInProgress: boolean
  onQueryExecution: () => void
  onListenExecution: () => void
  /**
   * Opens the redesigned Vision. Offered here for good while the beta flag is on, since the
   * invitation toast stays away once dismissed
   */
  onSwitchToRedesign?: () => void
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
  onSwitchToRedesign,
}: VisionGuiControlsProps) {
  const {t} = useTranslation(visionLocaleNamespace)

  return (
    <ControlsContainer>
      <Card padding={3} paddingX={3}>
        <Tooltip
          animate
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
          <Flex justifyContent="space-evenly">
            <Box flexBasis="0%" flexGrow={1}>
              <Tooltip
                animate
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
            <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
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
            {onSwitchToRedesign && (
              <Box flexShrink={0} marginLeft={3}>
                <Tooltip
                  animate
                  content={<Text size={1}>{t('vista.redesign.try.description')}</Text>}
                  placement="top"
                  portal
                >
                  <Button
                    aria-label={t('vista.redesign.try')}
                    data-testid="vision-try-redesign"
                    icon={RocketIcon}
                    mode="bleed"
                    onClick={onSwitchToRedesign}
                    tone="primary"
                    type="button"
                  />
                </Tooltip>
              </Box>
            )}
          </Flex>
        </Tooltip>
      </Card>
    </ControlsContainer>
  )
}
