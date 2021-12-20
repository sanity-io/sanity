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
  Code,
  rgba,
  TextInput,
  TextArea,
  studioTheme,
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
  WarningOutlineIcon,
} from '@sanity/icons'
import styled from 'styled-components'
import {Resizable} from 're-resizable'
import {Default} from './Default'
import {HasImage} from './HasImage'
import {Uploading} from './Uploading'

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

const UploadCircle = styled(Box)`
  width: 35px;
  height: 35px;
  border: 5px solid var(--card-focus-ring-color);
  border-radius: 50%;
`

const ResizeHandle = styled(Card)`
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 1rem;
  background-color: transparent;

  &:hover {
    background-color: ${({theme}) => rgba(theme.sanity.color.base.fg, 0.1)};
    cursor: ns-resize;
  }
`
const MAX_HEIGHT = '15rem'

export default function CompactImage() {
  const hasImage = useBoolean('Image', false, 'Props')
  const readOnly = useBoolean('Read only', false, 'Props')
  const drag = useBoolean('Drag file', false, 'Props')
  const uploading = useBoolean('Uploading', false, 'Props')
  const assetSources = useBoolean('Asset sources', false, 'Props')
  const [showExpandDialog, setShowExpandDialog] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasDetails = useBoolean('Has details', true, 'Props')
  const uploadError = useBoolean('Upload error', false, 'Props')

  return (
    <>
      <Container width={1}>
        <Stack space={6} marginTop={6} marginX={2}>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Slug
            </Text>
            <Flex gap={1}>
              <Box flex={1}>
                <TextInput />
              </Box>
              <Button fontSize={2} mode="ghost" text="Generate" />
            </Flex>
          </Stack>
          {/* <Stack space={3}>
            <Text weight="semibold" size={1}>
              Very compact default mode
            </Text>
            <Card
              border
              padding={3}
              style={{
                borderStyle: 'dashed',
              }}
            >
              <Flex align="center" justify="space-between" gap={3}>
                <Flex align="center" justify="center" gap={2} flex={1}>
                  <Text size={1} muted>
                    <ImageIcon />
                  </Text>
                  <Text size={1} muted>
                    Paste or drag image here
                  </Text>
                </Flex>
                <Inline space={2}>
                  <Button fontSize={2} text="Select" icon={SearchIcon} mode="ghost" />
                  <Button fontSize={2} text="Upload" icon={UploadIcon} mode="ghost" />
                </Inline>
              </Flex>
            </Card>
          </Stack> */}
          <Stack space={3} paddingX={[3, 3, 0, 0]}>
            <Text weight="semibold" size={1}>
              Image input
            </Text>
            {uploadError && (
              <Card tone="caution" padding={4} border radius={2}>
                <Flex gap={4} marginBottom={4}>
                  <Box>
                    <Text size={1}>
                      <WarningOutlineIcon />
                    </Text>
                  </Box>
                  <Stack space={3}>
                    <Text size={1} weight="semibold">
                      Incomplete upload
                    </Text>
                    <Text size={1}>
                      An upload has made no progress in the last 6m and likely got interrupted. You
                      can safely clear the incomplete upload and try uploading again.
                    </Text>
                  </Stack>
                </Flex>
                <Button icon={ResetIcon} text="Clear upload" mode="ghost" style={{width: '100%'}} />
              </Card>
            )}
            {!hasImage && !uploading && (
              <Default
                drag={drag}
                assetSources={assetSources}
                readOnly={readOnly}
                uploadError={uploadError}
              />
            )}

            {hasImage && (
              <HasImage
                drag={drag}
                assetSources={assetSources}
                hasDetails={hasDetails}
                readOnly={readOnly}
                uploading={uploading}
              />
            )}

            {!hasImage && uploading && <Uploading />}
          </Stack>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Another field
            </Text>
            <TextArea />
          </Stack>

          {/* <Stack space={3}>
            <Text weight="semibold" size={1}>
              Even more compact
            </Text>
            <Card>
              <Button text="Select image" icon={SearchIcon} mode="ghost" />
            </Card>
          </Stack> */}
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
