import {
  EditIcon,
  EllipsisVerticalIcon,
  SearchIcon,
  ImageIcon,
  UploadIcon,
  ResetIcon,
  DownloadIcon,
  ClipboardIcon,
} from '@sanity/icons'
import {
  Card,
  Flex,
  Inline,
  Code,
  studioTheme,
  rgba,
  Button,
  Box,
  Heading,
  Menu,
  Label,
  Tooltip,
  Text,
  MenuButton,
  MenuItem,
  MenuGroup,
  MenuDivider,
} from '@sanity/ui'
import React, {useRef, useState, useEffect} from 'react'
import styled from 'styled-components'

const RatioBox = styled(Card)`
  position: relative;
  /* padding-bottom: min(200px, 30vh); //min(calc(${({ratio = 3 / 2}) =>
    1 / ratio} * 100%), 30vh); */
  /* height: 30vh; */
  /* min-height: 3.75rem; */
  max-height: ${({maxHeight}) => maxHeight};
  width: 100%;
  resize: vertical;
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
  color: ${studioTheme.color.light.primary.card.enabled.fg};
  background-color: ${({theme, drag}) =>
    drag ? rgba(studioTheme.color.light.primary.card.enabled.bg, 0.8) : 'transparent'};
`

const ProgressBar = styled(Card)`
  background-color: ${({theme}) => theme.sanity.color.spot.blue};
`

const MAX_HEIGHT = '15rem'

export function HasImage(props) {
  const {drag, hasDetails, readOnly, assetSources} = props
  const imageContainer = useRef()
  const [maxHeight, setMaxHeight] = useState(MAX_HEIGHT)
  const firstResize = useRef(true)
  const storedHeight = window.localStorage.getItem('imageHeight')

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (!firstResize.current) {
        setMaxHeight('unset')
        window.localStorage.setItem('imageHeight', imageContainer.current.offsetHeight)
      }

      if (firstResize.current) {
        firstResize.current = false
      }
    })

    if (imageContainer.current) {
      ro.observe(imageContainer.current)
    }

    return () => ro.disconnect()
  }, [])

  // useEffect(() => {
  //   console.log('imagecontainer')
  //   // if (!hasImage && imageContainer.current) {
  //   //   setMaxHeight(MAX_HEIGHT)
  //   //   // imageContainer.current.style.removeProperty('height')
  //   // }

  //   // if (hasImage) {
  //   // }
  //   const storedHeight = window.localStorage.getItem('imageHeight')
  //   imageContainer.current.style.minHeight = undefined
  //   imageContainer.current.style.height = storedHeight ? `${storedHeight}px` : '30vh'

  // }, [imageContainer])

  return (
    <Card border tabIndex={0} tone={drag ? 'primary' : 'default'}>
      <RatioBox
        ref={imageContainer}
        // maxHeight={maxHeight}
        style={{
          maxHeight: storedHeight ? 'unset' : maxHeight,
          height: storedHeight ? `${storedHeight}px` : '30vh',
        }}
        // onResize={handleResize}
        paddingY={5}
      >
        <Card data-container tone="transparent" sizing="border">
          <img src={'https://source.unsplash.com/random?moon'} />
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
              <Text size={1}>Drop image to upload</Text>
            </Flex>
          )}
          <Inline data-buttons space={1}>
            {hasDetails && (
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
            )}
            <MenuButton
              id="image-menu"
              button={<Button icon={EllipsisVerticalIcon} mode="ghost" />}
              portal
              menu={
                <Menu>
                  <Card padding={2}>
                    <Label muted size={1}>
                      Replace
                    </Label>
                  </Card>
                  {!assetSources && <MenuItem icon={SearchIcon} text="Browse" disabled={readOnly} />}
                  {assetSources && (
                    <MenuGroup text="Browse"  disabled={readOnly} >
                      <MenuItem icon={ImageIcon} text="Media" />
                      <MenuItem icon={ImageIcon} text="Unsplash" />
                    </MenuGroup>
                  )}
                  <MenuItem icon={UploadIcon} text="Upload"  disabled={readOnly} />
                  <MenuDivider />
                    <MenuItem icon={DownloadIcon} text="Download image" />
                    <MenuItem icon={ClipboardIcon} text="Copy URL" />
                  <MenuDivider />
                  <MenuItem icon={ResetIcon} text="Clear field" tone="critical"  disabled={readOnly} />
                </Menu>
              }
            />
          </Inline>
        </Overlay>
      </RatioBox>
    </Card>
  )
}
