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
} from '@sanity/ui'
import {
  BinaryDocumentIcon,
  DocumentIcon,
  DownloadIcon,
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
    <Container width={1} padding={[3, 3, 0, 0]}>
      <Stack space={6}>
        <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            Compact file
          </Text>
          <Card
            border
            padding={hasFile ? 3 : 5}
            tone={hasFile ? 'default' : 'default'}
            style={{
              position: 'relative',
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
                    <Button fontSize={1} text="Upload" icon={UploadIcon} mode="ghost" />
                    <Button fontSize={1} text="Select" icon={SearchIcon} mode="ghost" />
                  </Inline>
                </Stack>
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
                        <MenuItem text="Replace" icon={SyncIcon} />
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

        <Stack space={3} marginTop={6}>
          <Text weight="semibold" size={1}>
            Even more compact file input
          </Text>
          <Card border={hasFile} padding={hasFile ? 3 : 0} tone={hasFile ? 'default' : 'default'}>
            <Flex height="fill" align="center" justify="space-between">
              {!hasFile && (
                <Button fontSize={1} text="Select or upload file" icon={SearchIcon} mode="ghost" />
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
        </Stack>
      </Stack>
    </Container>
  )
}
