import {CheckmarkIcon} from '@sanity/icons'
import {Avatar, Box, Card, Menu, MenuDivider} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'
import React from 'react'
import {PreviewMenuItem} from '../previewMenuItem'

const AVATAR_INITIALS = 'A.W.'

export default function PreviewMenuItemStory() {
  const badge = useString('Badge', 'Badge', 'Props') || ''
  const subtitle = useString('Subtitle', 'Subtitle', 'Props') || ''
  const text = useString('Text', 'Text', 'Props') || ''

  return (
    <Box padding={4}>
      <Card border>
        <Menu>
          <PreviewMenuItem preview={<Avatar initials={AVATAR_INITIALS} size={0} />} text="Text" />
          <PreviewMenuItem
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            text={text}
          />
          <MenuDivider />
          <PreviewMenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={0} />}
            subtitle={subtitle}
            text={text}
          />
          <MenuDivider />
          <PreviewMenuItem preview={<Avatar initials={AVATAR_INITIALS} size={1} />} text={text} />
          <PreviewMenuItem
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            text={text}
          />
          <MenuDivider />
          <PreviewMenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={1} />}
            subtitle={subtitle}
            text={text}
          />
          <MenuDivider />
          <PreviewMenuItem preview={<Avatar initials={AVATAR_INITIALS} size={2} />} text={text} />
          <PreviewMenuItem
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            text={text}
          />
          <MenuDivider />
          <PreviewMenuItem
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            subtitle={subtitle}
            text={text}
          />
          <PreviewMenuItem
            badge={badge}
            iconRight={CheckmarkIcon}
            preview={<Avatar initials={AVATAR_INITIALS} size={2} />}
            subtitle={subtitle}
            text={text}
          />
        </Menu>
      </Card>
    </Box>
  )
}
