import {SplitPane} from '@rexxars/react-split-pane'
import {type MutationEvent} from '@sanity/client'
import {Box, Flex} from '@sanity/ui'
import {type ChangeEvent, type RefObject} from 'react'
import {type PerspectiveContextValue, useTranslation} from 'sanity'

import {VisionCodeMirror} from '../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../i18n'
import {type SupportedPerspective} from '../perspectives'
import {ParamsEditor, type ParamsEditorChangeEvent} from './ParamsEditor'
import {type PaneSizeOptions} from './VisionGui'
import {
  InputBackgroundContainerLeft,
  InputContainer,
  Root,
  SplitpaneContainer,
  StyledLabel,
} from './VisionGui.styled'
import {VisionGuiControls} from './VisionGuiControls'
import {VisionGuiHeader} from './VisionGuiHeader'
import {VisionGuiResult} from './VisionGuiResult'

interface VisionGuiProps {
  apiVersion: string
  customApiVersion: string | false
  customApiVersionElementRef: RefObject<HTMLInputElement | null>
  dataset: string
  datasets: string[]
  error?: Error | undefined
  e2eTime?: number | undefined
  handleChangeApiVersion: (evt: ChangeEvent<HTMLSelectElement>) => void
  handleChangeDataset: (evt: ChangeEvent<HTMLSelectElement>) => void
  handleChangePerspective: (evt: ChangeEvent<HTMLSelectElement>) => void
  handleCustomApiVersionChange: (event: ChangeEvent<HTMLInputElement>) => void
  hasValidParams: boolean
  isValidApiVersion: boolean
  listenInProgress: boolean
  listenMutations: MutationEvent[]
  narrowBreakpoint: boolean
  paneSizeOptions: PaneSizeOptions
  paramsError?: string | undefined
  perspective: SupportedPerspective | undefined
  pinnedPerspective: PerspectiveContextValue
  query: string
  queryInProgress: boolean
  queryResult?: unknown | undefined
  queryTime?: number | undefined
  rawParams: string
  url?: string | undefined
  visionRootRef: RefObject<HTMLDivElement | null>
  queryEditorContainerRef: RefObject<HTMLDivElement | null>
  paramsEditorContainerRef: RefObject<HTMLDivElement | null>
  handleQueryChange: (query: string) => void
  handleParamsChange: (event: ParamsEditorChangeEvent) => void
  handleQueryExecution: () => void
  handleListenExecution: () => void
}

export function VisionGuiComponent({
  apiVersion,
  customApiVersion,
  customApiVersionElementRef,
  dataset,
  datasets,
  error,
  e2eTime,
  handleChangeApiVersion,
  handleChangeDataset,
  handleChangePerspective,
  handleCustomApiVersionChange,
  hasValidParams,
  isValidApiVersion,
  listenInProgress,
  listenMutations,
  narrowBreakpoint,
  paneSizeOptions,
  paramsError,
  perspective,
  pinnedPerspective,
  query,
  queryInProgress,
  queryResult,
  queryTime,
  rawParams,
  url,
  visionRootRef,
  queryEditorContainerRef,
  paramsEditorContainerRef,
  handleQueryChange,
  handleParamsChange,
  handleQueryExecution,
  handleListenExecution,
}: VisionGuiProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Root direction="column" height="fill" ref={visionRootRef} sizing="border" overflow="hidden">
      <VisionGuiHeader
        apiVersion={apiVersion}
        customApiVersion={customApiVersion}
        dataset={dataset}
        datasets={datasets}
        onChangeDataset={handleChangeDataset}
        onChangeApiVersion={handleChangeApiVersion}
        customApiVersionElementRef={customApiVersionElementRef}
        onCustomApiVersionChange={handleCustomApiVersionChange}
        isValidApiVersion={isValidApiVersion}
        pinnedPerspective={pinnedPerspective}
        onChangePerspective={handleChangePerspective}
        url={url}
        perspective={perspective}
      />
      <SplitpaneContainer flex="auto">
        <SplitPane
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          split={narrowBreakpoint ? 'vertical' : 'horizontal'}
          minSize={280}
          defaultSize={400}
          maxSize={-400}
        >
          <Box height="stretch" flex={1}>
            {/*
                    The way react-split-pane handles the sizes is kind of finicky and not clear. What the props above does is:
                    - It sets the initial size of the panes to 1/2 of the total available height of the container
                    - Sets the minimum size of a pane whatever is bigger of 1/2 of the total available height of the container, or 170px
                    - The max size is set to either 60% or 70% of the available space, depending on if the container height is above 650px
                    - Disables resizing when total height is below 500, since it becomes really cumbersome to work with the panes then
                    - The "primary" prop (https://github.com/tomkp/react-split-pane#primary) tells the second pane to shrink or grow by the available space
                    - Disables resize if the container height is less then 500px
                    This should ensure that we mostly avoid a pane to take up all the room, and for the controls to not be eaten up by the pane
                  */}
            <SplitPane
              className="sidebarPanes"
              split="horizontal"
              defaultSize={narrowBreakpoint ? paneSizeOptions.defaultSize : paneSizeOptions.minSize}
              size={paneSizeOptions.size}
              allowResize={paneSizeOptions.allowResize}
              minSize={narrowBreakpoint ? paneSizeOptions.minSize : 100}
              maxSize={paneSizeOptions.maxSize}
              primary="first"
            >
              <InputContainer display="flex" ref={queryEditorContainerRef}>
                <Box flex={1}>
                  <InputBackgroundContainerLeft>
                    <Flex>
                      <StyledLabel muted>{t('query.label')}</StyledLabel>
                    </Flex>
                  </InputBackgroundContainerLeft>
                  <VisionCodeMirror value={query} onChange={handleQueryChange} />
                </Box>
              </InputContainer>
              <InputContainer display="flex" ref={paramsEditorContainerRef}>
                <ParamsEditor
                  value={rawParams}
                  onChange={handleParamsChange}
                  paramsError={paramsError}
                  hasValidParams={hasValidParams}
                />

                <VisionGuiControls
                  hasValidParams={hasValidParams}
                  queryInProgress={queryInProgress}
                  listenInProgress={listenInProgress}
                  onQueryExecution={handleQueryExecution}
                  onListenExecution={handleListenExecution}
                />
              </InputContainer>
            </SplitPane>
          </Box>
          <VisionGuiResult
            error={error}
            queryInProgress={queryInProgress}
            queryResult={queryResult}
            listenInProgress={listenInProgress}
            listenMutations={listenMutations}
            dataset={dataset}
            queryTime={queryTime}
            e2eTime={e2eTime}
          />
        </SplitPane>
      </SplitpaneContainer>
    </Root>
  )
}
