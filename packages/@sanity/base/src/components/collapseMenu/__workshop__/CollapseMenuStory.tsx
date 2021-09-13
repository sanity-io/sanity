import React from 'react'
import {Card, Container} from '@sanity/ui'
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  OlistIcon,
  StrikethroughIcon,
  UlistIcon,
} from '@sanity/icons'
import {CollapseMenu, CollapseMenuButton, CollapseMenuDivider} from '..'

export default function CollapseMenuStory() {
  return (
    <Container padding={4} width={2} sizing="border">
      <Card shadow={1} padding={1} radius={2}>
        <CollapseMenu>
          <CollapseMenuButton text="Bold" icon={BoldIcon} mode="bleed" />
          <CollapseMenuButton text="Italic" icon={ItalicIcon} mode="bleed" />
          <CollapseMenuDivider />
          <CollapseMenuButton text="Code" icon={CodeIcon} mode="bleed" />
          <CollapseMenuButton text="Strike" icon={StrikethroughIcon} mode="bleed" />
          <CollapseMenuDivider />
          <CollapseMenuButton text="OList" icon={OlistIcon} mode="bleed" />
          <CollapseMenuButton text="UList" icon={UlistIcon} mode="bleed" />
          <CollapseMenuButton text="Link" icon={LinkIcon} mode="bleed" />
        </CollapseMenu>
      </Card>
    </Container>
  )
}
