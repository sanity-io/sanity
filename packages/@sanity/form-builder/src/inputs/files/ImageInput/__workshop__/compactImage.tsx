import React, {useState} from 'react'
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
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from '@sanity/icons'
import styled from 'styled-components'
import {Resizable} from 're-resizable'

const Resize = styled(Resizable)`
  width: 100%;
  overflow: hidden;
  resize: ${({enable}) => (enable ? 'vertical' : 'initial')};

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
  padding-bottom: min(200px, 30vh); //min(calc(${({ratio = 3 / 2}) => 1 / ratio} * 100%), 30vh);
  width: 100%;
  overflow: hidden;

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
  const hasImage = useBoolean('Image', false, 'Props')
  const drag = useBoolean('Drag file', false, 'Props')
  const assetSources = useBoolean('Asset sources', false, 'Props')
  const padImage = useBoolean('Pad image', false, 'Props')
  const [showExpandDialog, setShowExpandDialog] = useState(false)

  return (
    <>
      <Container width={1}>
        <Stack space={2} marginTop={6} paddingX={[3, 3, 0, 0]}>
          <Text weight="semibold" size={1}>
            Image input
          </Text>
          <Card border style={{borderStyle: hasImage ? 'solid' : 'dashed'}}>
            <Resize
              direction="vertical"
              defaultSize={{height: '30vh'}}
              minHeight={200}
              enable={hasImage}
            >
              {hasImage && (
                <>
                  <Card
                    data-container
                    padding={padImage ? 3 : 0}
                    tone="transparent"
                    sizing="border"
                  >
                    <img src={'https://source.unsplash.com/random'} />
                  </Card>
                  <Overlay justify="flex-end" padding={3} drag={drag}>
                    {drag && (
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
                        <Button mode="ghost" icon={EditIcon} />
                      </Tooltip>
                      <Tooltip
                        content={
                          <Box padding={2}>
                            <Text muted size={1}>
                              Expand
                            </Text>
                          </Box>
                        }
                      >
                        <Button
                          mode="ghost"
                          icon={ExpandIcon}
                          onClick={() => setShowExpandDialog(true)}
                        />
                      </Tooltip>
                      <MenuButton
                        id="image-menu"
                        button={<Button icon={EllipsisVerticalIcon} mode="ghost" />}
                        portal
                        menu={
                          <Menu>
                            <MenuItem icon={UploadIcon} text="Upload" />
                            {!assetSources && <MenuItem icon={SearchIcon} text="Browse" />}
                            {assetSources && (
                              <MenuGroup text="Browse">
                                <MenuItem icon={ImageIcon} text="Media" />
                                <MenuItem icon={ImageIcon} text="Unsplash" />
                              </MenuGroup>
                            )}
                            <MenuDivider />
                            <MenuItem icon={TrashIcon} text="Remove" tone="critical" />
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
                    <Flex justify="center">
                      <Card padding={4} radius={2}>
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

                    <Inline data-buttons space={1}>
                      <Button
                        onClick={() => setHasImage(true)}
                        text="Upload"
                        mode="ghost"
                        icon={UploadIcon}
                      />
                      {!assetSources && (
                        <Button text="Browse media" mode="ghost" icon={SearchIcon} />
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
            </Resize>
          </Card>
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
