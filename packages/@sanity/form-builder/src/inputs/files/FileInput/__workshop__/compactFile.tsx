import {
  Container,
  Stack,
  Box,
  Card,
  Text,
  Flex,
  Inline,
  Button,
  MenuButton,
  Menu,
  MenuItem,
  MenuDivider,
  Label,
  Dialog,
  TextInput,
} from '@sanity/ui'
import {
  BinaryDocumentIcon,
  ClipboardIcon,
  DocumentIcon,
  DownloadIcon,
  EditIcon,
  EllipsisVerticalIcon,
  ReadOnlyIcon,
  ResetIcon,
  SearchIcon,
  SyncIcon,
  UploadIcon,
} from '@sanity/icons'
import {useBoolean} from '@sanity/ui-workshop'
import styled from 'styled-components'
import {useState} from 'react'
import React from 'react'

const Overlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export default function CompactFile() {
  const hasFile = useBoolean('File', false, 'Props')
  const readOnly = useBoolean('Read only', false, 'Props')
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container width={[0, 1, 1]}>
      <Stack space={6} marginX={[2, 2, 0]}>
        {/* Alt 0. */}
        <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            File input
          </Text>
          <Card
            border
            padding={hasFile ? 1 : 3}
            tone={readOnly ? 'transparent' : 'default'}
            style={{
              position: 'relative',
              borderStyle: hasFile ? 'solid' : 'dashed',
            }}
          >
            {!hasFile && (
              <Flex
                align="center"
                justify="space-between"
                gap={4}
                direction={['column', 'column', 'row']}
                paddingY={[2, 2, 0]}
              >
                <Flex align="center" justify="center" gap={2} flex={1}>
                  <Text size={1} muted>
                    {readOnly ? <ReadOnlyIcon /> : <BinaryDocumentIcon />}
                  </Text>
                  <Text size={1} muted>
                    {readOnly ? 'Read only' : 'Paste or drag file here'}
                  </Text>
                </Flex>
                <Inline space={2}>
                  <Button
                    fontSize={2}
                    text="Select"
                    icon={SearchIcon}
                    mode="ghost"
                    disabled={readOnly}
                  />
                  <Button
                    fontSize={2}
                    text="Upload"
                    icon={UploadIcon}
                    mode="ghost"
                    disabled={readOnly}
                  />
                </Inline>
              </Flex>
            )}
            {hasFile && (
              <Flex align="center" justify="space-between" paddingRight={2}>
                <Card flex={1} tone={readOnly ? 'transparent' : 'default'}>
                  <Button
                    mode="bleed"
                    style={{width: '100%'}}
                    padding={2}
                    disabled={readOnly}
                    onClick={() => setDialogOpen(true)}
                  >
                    <Inline space={3} flex={1}>
                      <Card padding={3} tone="transparent" shadow={1} radius={1}>
                        <Text muted={readOnly}>
                          <BinaryDocumentIcon />
                        </Text>
                      </Card>
                      <Stack space={2}>
                        <Text size={2}>document-file-name.pdf</Text>
                        <Text size={1} muted>
                          2.3MB
                        </Text>
                      </Stack>
                    </Inline>
                  </Button>
                </Card>
                <Card tone={readOnly ? 'transparent' : 'default'}>
                  <MenuButton
                    id="compact-file-menu-button"
                    button={<Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} />}
                    popover={{tone: 'default'}}
                    menu={
                      <Menu>
                        <Box padding={2}>
                          <Label muted size={1}>
                            Replace
                          </Label>
                        </Box>
                        <MenuItem text="Select" icon={SearchIcon} disabled={readOnly} />
                        <MenuItem text="Upload" icon={UploadIcon} disabled={readOnly} />
                        <MenuDivider />
                        <MenuItem text="Download file" icon={DownloadIcon} />
                        <MenuItem text="Copy URL" icon={ClipboardIcon} />
                        <MenuDivider />
                        <MenuItem
                          text="Clear field"
                          icon={ResetIcon}
                          tone="critical"
                          disabled={readOnly}
                        />
                      </Menu>
                    }
                  />
                </Card>
              </Flex>
            )}
          </Card>
        </Stack>

        {/* Alt 1. */}
        {/* <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            Alternative 1
          </Text>
          <Card
            border={hasFile}
            paddingLeft={hasFile ? 4 : 0}
            paddingRight={hasFile ? 3 : 0}
            paddingY={hasFile ? 3 : 0}
            tone={hasFile ? 'default' : 'default'}
            style={{
              position: 'relative',
              borderStyle: hasFile ? 'solid' : 'dashed',
            }}
          >
            {!hasFile && (
              <Flex align="center" justify="space-between" gap={2}>
                <Card flex={1} border padding={3} radius={2} style={{borderStyle: 'dashed'}}>
                  <Text size={1} muted>
                    <UploadIcon /> &nbsp; Paste or drag file here
                  </Text>
                </Card>
                <Inline space={2}>
                  <Button fontSize={2} text="Select" icon={SearchIcon} mode="ghost" />
                  <Button fontSize={2} text="Upload" icon={UploadIcon} mode="ghost" />
                </Inline>
              </Flex>
            )}
            {hasFile && (
              <Flex align="center" justify="space-between">
                <Inline space={3} flex={1}>
                  <Text muted>
                    <BinaryDocumentIcon />
                  </Text>
                  <Text size={2} muted>
                    document-file-name.pdf
                  </Text>
                </Inline>
                <Box>
                  <MenuButton
                    id="compact-file-menu-button"
                    button={<Button icon={EllipsisVerticalIcon} mode="bleed" />}
                    menu={
                      <Menu>
                        <Box padding={2}>
                          <Label muted size={1}>
                            Replace
                          </Label>
                        </Box>
                        <MenuItem text="Select" icon={SearchIcon} />
                        <MenuItem text="Upload" icon={UploadIcon} />
                        <MenuDivider />
                        <MenuItem text="Download file" icon={DownloadIcon} />
                        <MenuDivider />
                        <MenuItem text="Clear field" disabled icon={ResetIcon} tone="critical" />
                      </Menu>
                    }
                  />
                </Box>
              </Flex>
            )}
          </Card>
        </Stack> */}

        {/* Alt 2. */}
        {/* <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            Alternative 2
          </Text>
          <Text size={1} muted>
            This one is most consistent with the image input
          </Text>
          <Card
            border
            padding={hasFile ? 5 : 5}
            tone={hasFile ? 'transparent' : 'default'}
            style={{
              position: 'relative',
              height: '6rem',
              borderStyle: hasFile ? 'solid' : 'dashed',
            }}
          >
            {!hasFile && (
              <Flex height="fill" align="center" justify="center">
                <Stack space={4}>
                  <Stack space={3}>
                    <Flex justify="center">
                      <Text muted>
                        <BinaryDocumentIcon />
                      </Text>
                    </Flex>
                    <Flex justify="center">
                      <Text size={1} muted>
                        Drag or paste file here
                      </Text>
                    </Flex>
                  </Stack>
                  <Inline space={2}>
                    <Button fontSize={2} text="Select" icon={SearchIcon} mode="ghost" />
                    <Button fontSize={2} text="Upload" icon={UploadIcon} mode="ghost" />
                  </Inline>
                </Stack>
              </Flex>
            )}
            {hasFile && (
              <Flex height="fill" align="center" justify="center">
                <Flex gap={3} flex={1} direction="column" align="center">
                  <Text muted>
                    <BinaryDocumentIcon />
                  </Text>
                  <Text size={1} muted>
                    document-file-name.pdf
                  </Text>
                </Flex>
                <Flex style={{position: 'absolute', top: 0, right: 0}} padding={3} gap={2}>
                  <Card>
                    <Button mode="ghost" icon={EditIcon} />
                  </Card>
                  <Card>
                    <MenuButton
                      id="compact-file-menu-button"
                      button={<Button icon={EllipsisVerticalIcon} mode="ghost" tone="default" />}
                      portal
                      menu={
                        <Menu>
                          <Box padding={2}>
                            <Label muted size={1}>
                              Replace
                            </Label>
                          </Box>
                          <MenuItem text="Select" icon={SearchIcon} />
                          <MenuItem text="Upload" icon={UploadIcon} />
                          <MenuDivider />
                          <MenuItem text="Download file" icon={DownloadIcon} />
                          <MenuDivider />
                          <MenuItem text="Clear field" icon={ResetIcon} tone="critical" />
                        </Menu>
                      }
                    />
                  </Card>
                </Flex>
              </Flex>
            )}
          </Card>
        </Stack> */}

        {/* <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            Even more compact file input
          </Text>
          <Card border={hasFile} padding={hasFile ? 3 : 0} tone={hasFile ? 'default' : 'default'}>
            <Flex height="fill" align="center" justify="space-between">
              {!hasFile && (
                <Button fontSize={2} text="Select or upload file" icon={SearchIcon} mode="ghost" />
              )}
              {hasFile && (
                <>
                  <Inline space={3} flex={1}>
                    <Text muted>
                      <BinaryDocumentIcon />
                    </Text>
                    <Text size={2} muted>
                      document-file-name.pdf
                    </Text>
                  </Inline>
                  <Box>
                    <MenuButton
                      id="compact-file-menu-button"
                      button={<Button icon={EllipsisVerticalIcon} mode="bleed" />}
                      menu={
                        <Menu>
                          <MenuItem text="Replace" icon={SyncIcon} />
                          <MenuItem text="Download file" icon={DownloadIcon} />
                          <MenuDivider />
                          <MenuItem text="Clear field" icon={ResetIcon} tone="critical" />
                        </Menu>
                      }
                    />
                  </Box>
                </>
              )}
            </Flex>
          </Card>
        </Stack> */}
      </Stack>
      {dialogOpen && (
        <Dialog header="Edit" onClose={() => setDialogOpen(false)}>
          <Box padding={4}>
            <Stack space={2}>
              <Text size={1} weight="semibold">
                Title
              </Text>
              <TextInput />
            </Stack>
          </Box>
        </Dialog>
      )}
    </Container>
  )
}
