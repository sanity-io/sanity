import React, {useState, useRef, useEffect} from 'react'
import {useBoolean} from '@sanity/ui-workshop'
import {
  Card,
  Container,
  Stack,
  Box,
  Text,
  Button,
  Inline,
  Heading,
  MenuGroup,
  MenuButton,
  Menu,
  MenuItem,
  Tooltip,
  Flex,
  MenuDivider,
  Dialog,
  Label,
} from '@sanity/ui'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  EllipsisVerticalIcon,
  ExpandIcon,
  FolderIcon,
  ImageIcon,
  PublishIcon,
  ResetIcon,
  SearchIcon,
  SyncIcon,
  TrashIcon,
  UploadIcon,
} from '@sanity/icons'
import styled from 'styled-components'
import {Resizable} from 're-resizable'

const Resize = styled(Resizable)`
  width: 100%;
  overflow: hidden;
  /* resize: ${({enable}) => (enable ? 'vertical' : 'initial')}; */

  & > [data-container] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }

  & img {
    max-width: 100%;
    max-height: 100%;
  }
`

const RatioBox = styled(Box)`
  position: relative;
  /* padding-bottom: min(200px, 30vh); //min(calc(${({ratio = 3 / 2}) =>
    1 / ratio} * 100%), 30vh); */
  height: 30vh;
  min-height: 10rem;
  max-height: ${({maxHeight}) => maxHeight};
  width: 100%;
  overflow: hidden;
  resize: ${({enableResize}) => (enableResize ? 'vertical' : 'initial')};

  & > div[data-container] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }

  & img {
    max-width: 100%;
    max-height: 100%;
  }
`

const Overlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: ${({drag}) => (drag ? 'blur(10px)' : '')};
  background-color: ${(props) =>
    props.drag
      ? `${props.theme.sanity.color.base.bg}${
          props.theme.sanity.color.base.bg.length === 4 ? '8' : '88'
        }`
      : ''};
`
export default function CompactImage() {
  const imageContainer = useRef()
  const hasImage = useBoolean('Image', false, 'Props')
  const readOnly = useBoolean('Read only', false, 'Props')
  const drag = useBoolean('Drag file', false, 'Props')
  const assetSources = useBoolean('Asset sources', false, 'Props')
  const [showExpandDialog, setShowExpandDialog] = useState(false)
  const [maxHeight, setMaxHeight] = useState('30rem')

  const ro = new ResizeObserver(() => {
    setMaxHeight('unset')
  })

  useEffect(() => {
    ro.observe(imageContainer.current)
  }, [])

  useEffect(() => {
    if (!hasImage && imageContainer.current) {
      imageContainer.current.style.height = '30vh'
      setMaxHeight('30rem')
    }
  }, [hasImage])
  return (
    <>
      <Container width={1}>
        <Stack space={6} marginTop={6}>
          <Stack space={2} paddingX={[3, 3, 0, 0]}>
            <Text weight="semibold" size={1}>
              Image input
            </Text>
            <Card border style={{borderStyle: hasImage ? 'solid' : 'dashed'}}>
              <RatioBox
                ref={imageContainer}
                maxHeight={maxHeight}
                minHeight={200}
                enableResize={hasImage}
                // onResize={handleResize}
              >
                {hasImage && (
                  <>
                    <Card data-container tone="transparent" sizing="border">
                      <img src={'https://source.unsplash.com/random'} />
                    </Card>
                    <Overlay justify="flex-end" padding={3} drag={drag && !readOnly}>
                      {drag && !readOnly && (
                        <Flex
                          direction="column"
                          align="center"
                          justify="center"
                          style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0}}
                        >
                          <Box marginBottom={3}>
                            <Heading>
                              <ImageIcon />
                            </Heading>
                          </Box>
                          <Text size={1}>Drop file to upload</Text>
                        </Flex>
                      )}
                      <Inline data-buttons space={1}>
                        <Tooltip
                          content={
                            <Box padding={2}>
                              <Text muted size={1}>
                                Edit details
                              </Text>
                            </Box>
                          }
                        >
                          <Button mode="ghost" icon={EditIcon} disabled={readOnly} />
                        </Tooltip>
                        <MenuButton
                          id="image-menu"
                          button={
                            <Button icon={EllipsisVerticalIcon} mode="ghost" disabled={readOnly} />
                          }
                          portal
                          menu={
                            <Menu>
                              <Card padding={2}>
                                <Label muted>Replace</Label>
                              </Card>
                              <MenuItem icon={UploadIcon} text="Upload" />
                              {!assetSources && <MenuItem icon={SearchIcon} text="Browse" />}
                              {assetSources && (
                                <MenuGroup text="Browse">
                                  <MenuItem icon={ImageIcon} text="Media" />
                                  <MenuItem icon={ImageIcon} text="Unsplash" />
                                </MenuGroup>
                              )}
                              <MenuDivider />
                              <MenuItem icon={ResetIcon} text="Clear field" tone="critical" />
                            </Menu>
                          }
                        />
                      </Inline>
                    </Overlay>
                  </>
                )}
                {!hasImage && (
                  <Box data-container>
                    <Stack space={3}>
                      {!readOnly && (
                        <Flex justify="center">
                          <Card marginBottom={[2, 2, 4, 4]} radius={2}>
                            <Stack space={3}>
                              <Flex justify="center">
                                <Text size={4} muted>
                                  <ImageIcon />
                                </Text>
                              </Flex>
                              <Text size={1} muted>
                                Drag or paste image here
                              </Text>
                            </Stack>
                          </Card>
                        </Flex>
                      )}

                      <Inline data-buttons space={1}>
                        <Button
                          text="Upload"
                          mode="ghost"
                          icon={UploadIcon}
                          disabled={readOnly}
                          fontSize={1}
                        />
                        {!assetSources && (
                          <Button
                            text="Browse media"
                            mode="ghost"
                            icon={SearchIcon}
                            disabled={readOnly}
                            fontSize={1}
                          />
                        )}
                        {assetSources && (
                          <MenuButton
                            id="asset-source-menubutton"
                            button={
                              <Button
                                text="Browse"
                                icon={SearchIcon}
                                iconRight={ChevronDownIcon}
                                mode="ghost"
                                disabled={readOnly}
                                fontSize={1}
                              />
                            }
                            menu={
                              <Menu icon={FolderIcon} text="Browse">
                                <MenuItem icon={ImageIcon} text="Media" />
                                <MenuItem icon={ImageIcon} text="Unsplash" />
                              </Menu>
                            }
                            portal
                          />
                        )}
                      </Inline>
                    </Stack>
                  </Box>
                )}
              </RatioBox>
            </Card>
          </Stack>

          <Stack space={3}>
            <Text weight="semibold" size={1}>
              Even more compact
            </Text>
            <Card>
              <Button text="Select image" icon={SearchIcon} mode="ghost" />
            </Card>
          </Stack>
        </Stack>
      </Container>
      {showExpandDialog && (
        <Dialog
          header="Image title"
          id="expanded-image-dialog"
          zOffset={1000}
          width={4}
          onClose={() => setShowExpandDialog(false)}
          style={{maxHeight: '100%'}}
        >
          <Card tone="transparent" padding={4} style={{height: 'calc(100% -'}}>
            <Flex height="fill" align="center" justify="center">
              <img
                src="https://source.unsplash.com/random"
                style={{objectFit: 'contain', maxWidth: '100%', maxHeight: '100%'}}
              />
            </Flex>
          </Card>
        </Dialog>
      )}
    </>
  )
}
