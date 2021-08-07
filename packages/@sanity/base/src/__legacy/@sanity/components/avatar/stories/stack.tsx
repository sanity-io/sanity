// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {hues} from '@sanity/color'
import {Avatar, AvatarStack} from 'part:@sanity/components/avatar'
import {number, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const colors = [
  {dark: hues.blue[400].hex, light: hues.blue[500].hex},
  {dark: hues.purple[400].hex, light: hues.purple[500].hex},
  {dark: hues.magenta[400].hex, light: hues.magenta[500].hex},
  {dark: hues.orange[400].hex, light: hues.orange[500].hex},
  {dark: hues.yellow[400].hex, light: hues.yellow[500].hex},
  {dark: hues.cyan[400].hex, light: hues.cyan[500].hex},
]

function getRandomColor() {
  const idx = Math.floor(Math.random() * colors.length)

  return colors[idx]
}

export function StackStory() {
  const props = {
    maxLength: number('Max. length', 4, 'Props'),
    size: select(
      'Size',
      {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
      },
      'small',
      'Props'
    ),
  }

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[AvatarStack]}>
        <AvatarStack {...props}>
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
          <Avatar color={getRandomColor()} initials="cy" />
          <Avatar color={getRandomColor()} initials="ma" />
          <Avatar color={getRandomColor()} initials="ye" />
          <Avatar color={getRandomColor()} initials="bl" />
        </AvatarStack>
      </Sanity>
    </CenteredContainer>
  )
}
