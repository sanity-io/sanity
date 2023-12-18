import {AddIcon, CloseIcon, RestoreIcon} from '@sanity/icons'
import {Path} from '@sanity/types'
import {
  BoundaryElementProvider,
  Card,
  Container,
  DialogProvider,
  Flex,
  LayerProvider,
  PortalProvider,
  Stack,
  Text,
  TextInput,
  useTheme,
} from '@sanity/ui'
import {useAction} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {Pane} from '../Pane'
import {PaneContent} from '../PaneContent'
import {PaneFooter} from '../PaneFooter'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'
import {ChangeConnectorRoot, ChangeFieldWrapper, ChangeIndicator, ScrollContainer} from 'sanity'
import {Button, Dialog} from 'sanity/_internal-ui-components'

const TestContainer = styled(Container).attrs({
  height: 'fill',
  width: 1,
})`
  max-height: 600px;
`

const Root = styled(ChangeConnectorRoot)`
  height: 100%;
  outline: 1px solid var(--card-border-color);
  position: relative;
`

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export default function ChangeConnectorsStory() {
  const [reviewChanges, setReviewChanges] = useState(false)
  const onSetFocus = useCallback(() => undefined, [])
  const [focusPath, setFocusPath] = useState<Path>([])

  const toggleReviewChanges = useCallback(() => setReviewChanges((v) => !v), [])
  const openReviewChanges = useCallback(() => setReviewChanges(true), [])
  const closeReviewChanges = useCallback(() => setReviewChanges(false), [])

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [documentContentElement, setdocumentContentElement] = useState<HTMLDivElement | null>(null)

  const handleLayoutCollapse = useAction('PaneLayout.onCollapse')
  const handleLayoutExpand = useAction('PaneLayout.onExpand')

  const {
    sanity: {media},
  } = useTheme()

  return (
    <LayerProvider>
      <Card height="fill" tone="transparent">
        <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
          <TestContainer>
            <Root
              isReviewChangesOpen={reviewChanges}
              onOpenReviewChanges={openReviewChanges}
              onSetFocus={onSetFocus}
            >
              <PaneLayout
                height="fill"
                minWidth={media[1]}
                onCollapse={handleLayoutCollapse}
                onExpand={handleLayoutExpand}
              >
                <Pane id="document-panel">
                  <PaneHeader title="Document" />
                  <PaneContent ref={setdocumentContentElement}>
                    <BoundaryElementProvider element={documentContentElement}>
                      <PortalProvider element={portalElement}>
                        <Scroller>
                          <Stack paddingX={4} paddingY={5} space={5}>
                            <StringField
                              focusPath={focusPath}
                              path={['a']}
                              value="A"
                              compareValue="B"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['b']}
                              value="B"
                              compareValue="C"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['c']}
                              value="C"
                              compareValue="D"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['d']}
                              value="D"
                              compareValue="D"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['e']}
                              value="D"
                              compareValue="D"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['f']}
                              value="D"
                              compareValue="D"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['g']}
                              value="D"
                              compareValue="D"
                              setFocusPath={setFocusPath}
                            />
                            <StringField
                              focusPath={focusPath}
                              path={['h']}
                              value="D"
                              compareValue="D"
                              setFocusPath={setFocusPath}
                            />
                          </Stack>
                        </Scroller>
                        <div ref={setPortalElement} />
                      </PortalProvider>
                    </BoundaryElementProvider>
                  </PaneContent>

                  <PaneFooter padding={2}>
                    <Button
                      icon={RestoreIcon}
                      mode="bleed"
                      onClick={toggleReviewChanges}
                      selected={reviewChanges}
                      tooltipProps={{content: 'Review changes'}}
                    />
                  </PaneFooter>
                </Pane>

                {reviewChanges && (
                  <Pane id="review-changes-panel">
                    <PaneHeader
                      actions={
                        <Button
                          icon={CloseIcon}
                          mode="bleed"
                          onClick={closeReviewChanges}
                          tooltipProps={{content: 'Close'}}
                        />
                      }
                      title="Changes"
                    />
                    <PaneContent>
                      <Scroller>
                        <Stack flex={1} paddingX={4} paddingY={5} space={5}>
                          <DebugDiffField path={['a']}>
                            <Text>Diff A</Text>
                          </DebugDiffField>
                          <DebugDiffField path={['b']}>
                            <Text>Diff B</Text>
                          </DebugDiffField>
                          <DebugDiffField path={['c']}>
                            <Text>Diff C</Text>
                          </DebugDiffField>
                        </Stack>
                      </Scroller>
                    </PaneContent>
                  </Pane>
                )}
              </PaneLayout>
            </Root>
          </TestContainer>
        </Flex>
      </Card>
    </LayerProvider>
  )
}

function StringField(props: {
  focusPath: Path
  path: Path
  value: string
  compareValue: string
  setFocusPath: (p: Path) => void
}) {
  const {focusPath, path, value, compareValue, setFocusPath} = props
  const [open, setOpen] = useState(false)
  const handleBlur = useCallback(() => setFocusPath([]), [setFocusPath])
  const handleFocus = useCallback(() => setFocusPath(path), [path, setFocusPath])

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  return (
    <Stack space={2}>
      <Text size={1} weight="medium">
        String
      </Text>
      <DebugFormField path={path} focusPath={focusPath} value={value} compareValue={compareValue}>
        <TextInput onBlur={handleBlur} onFocus={handleFocus} value={value} />
      </DebugFormField>

      <div>
        <Button
          icon={<AddIcon />}
          mode="ghost"
          onClick={handleOpen}
          tooltipProps={{content: 'Add'}}
        />
      </div>

      {open && (
        <DialogProvider position="absolute">
          <Dialog id={`${path.join('-')}-dialog`} onClickOutside={handleClose}>
            <Text size={1}>Dialog</Text>
          </Dialog>
        </DialogProvider>
      )}
    </Stack>
  )
}

function DebugFormField(props: {
  children?: React.ReactNode
  focusPath: Path
  path: Path
  value: unknown
  compareValue: unknown
}) {
  const {children, focusPath, path, value, compareValue} = props

  return (
    <ChangeIndicator path={path} isChanged={false} hasFocus={false}>
      {children}
    </ChangeIndicator>
  )
}

function DebugDiffField(props: {children?: React.ReactNode; path: Path}) {
  const {children, path} = props
  const [hovered, setHovered] = useState(false)

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  const handleClick = useCallback(() => {
    //
  }, [])

  return (
    <Stack space={2}>
      <Text size={1} weight="medium">
        String
      </Text>
      <ChangeFieldWrapper hasHover={hovered} path={path}>
        <Card
          borderLeft
          onClick={handleClick}
          padding={3}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </Card>
      </ChangeFieldWrapper>
    </Stack>
  )
}
