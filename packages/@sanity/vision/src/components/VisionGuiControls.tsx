import {PlayIcon, StopIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Hotkeys, Text, Tooltip} from '@sanity/ui'
import {type Dispatch, type RefObject, type SetStateAction} from 'react'
import {useTranslation} from 'sanity'

import {type VisionCodeMirrorHandle} from '../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../i18n'
import {QueryRecall} from './QueryRecall'
import {type Params} from './VisionGui'
import {ControlsContainer} from './VisionGui.styled'

export interface VisionGuiControlsProps {
  hasValidParams: boolean
  queryInProgress: boolean
  listenInProgress: boolean
  onQueryExecution: () => void
  onListenExecution: () => void
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  params: Params
  setParams: Dispatch<SetStateAction<Params>>
  perspective: string
  setPerspective: (newPerspective: string) => void
  editorQueryRef: RefObject<VisionCodeMirrorHandle | null>
  editorParamsRef: RefObject<VisionCodeMirrorHandle | null>
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
  query,
  setQuery,
  params,
  setParams,
  perspective,
  setPerspective,
  editorQueryRef,
  editorParamsRef,
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
        <QueryRecall
          params={params}
          perspective={perspective}
          query={query}
          setQuery={setQuery}
          setParams={setParams}
          setPerspective={setPerspective}
          editorQueryRef={editorQueryRef}
          editorParamsRef={editorParamsRef}
        />
      </Card>
    </ControlsContainer>
  )
}
