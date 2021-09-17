import React from 'react'
import {Card, Container} from '@sanity/ui'
import {BoldIcon, CodeIcon, ItalicIcon, OlistIcon, UlistIcon} from '@sanity/icons'
import {CollapseMenu, CollapseMenuButton, CollapseMenuDivider} from '..'
import UnderlineIcon from '../icons/FormatUnderlined'

export default function CollapseMenuStory() {
  return (
    <Container padding={4} width={4} sizing="border">
      <Card shadow={1} padding={1} radius={2}>
        <CollapseMenu>
          <CollapseMenuButton
            icon={BoldIcon}
            text="Bold"
            buttonProps={{mode: 'bleed'}}
            tooltipProps={{placement: 'right'}}
          />
          <CollapseMenuButton icon={ItalicIcon} text="Italic" buttonProps={{mode: 'bleed'}} />
          <CollapseMenuDivider />
          <CollapseMenuButton icon={CodeIcon} text="Code" buttonProps={{mode: 'bleed'}} />
          <CollapseMenuButton icon={UnderlineIcon} text="Underline" buttonProps={{mode: 'bleed'}} />
          <CollapseMenuDivider />
          <CollapseMenuButton icon={UlistIcon} text="Ulist" buttonProps={{mode: 'bleed'}} />
          <CollapseMenuButton
            icon={OlistIcon}
            text="Olist"
            buttonProps={{mode: 'bleed'}}
            selected
          />
        </CollapseMenu>
      </Card>
    </Container>
  )
}
