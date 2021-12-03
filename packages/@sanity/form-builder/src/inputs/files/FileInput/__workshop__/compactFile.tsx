import React from 'react'
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
} from '@sanity/ui'
import {
  BinaryDocumentIcon,
  DocumentIcon,
  DownloadIcon,
  EditIcon,
  EllipsisVerticalIcon,
  ResetIcon,
  SearchIcon,
  SyncIcon,
  UploadIcon,
} from '@sanity/icons'
import {useBoolean} from '@sanity/ui-workshop'
import styled from 'styled-components'

const Overlay = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

export default function CompactFile() {
  const hasFile = useBoolean('File', false, 'Props')

  return (
    <Container width={[0, 1, 1]}>
      <Stack space={6} marginX={[2, 2, 0]}>
        {/* Alt 0. */}
        <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            Alternative 0
          </Text>
          <Card
            border
            padding={3}
            tone={hasFile ? 'transparent' : 'default'}
            style={{
              position: 'relative',
              borderStyle: hasFile ? 'solid' : 'dashed',
            }}
          >
            {!hasFile && (
              <Flex
                align="center"
                justify="space-between"
                gap={[4, 4, 3]}
                direction={['column-reverse', 'column-reverse', 'row']}
                paddingY={[2, 2, 0]}
              >
                <Flex align="center" justify="center" gap={2} flex={1}>
                  <Text size={1} muted>
                    <BinaryDocumentIcon />
                  </Text>
                  <Text size={1} muted>
                    Paste or drag file here
                  </Text>
                </Flex>
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
                  <Inline space={2}>
                    <Card>
                      <Button mode="ghost" icon={EditIcon} />
                    </Card>
                    <Card>
                      <MenuButton
                        id="compact-file-menu-button"
                        button={<Button icon={EllipsisVerticalIcon} mode="ghost" />}
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
                  </Inline>
                </Box>
              </Flex>
            )}
          </Card>
        </Stack>

        {/* Alt 1. */}
        <Stack space={3} marginTop={6}>
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
                        <MenuItem text="Clear field" icon={ResetIcon} tone="critical" />
                      </Menu>
                    }
                  />
                </Box>
              </Flex>
            )}
          </Card>
        </Stack>

        {/* Alt 2. */}
        <Stack space={3} marginTop={6}>
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
        </Stack>

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
    </Container>
  )
}
