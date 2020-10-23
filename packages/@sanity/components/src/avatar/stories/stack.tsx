import {color} from '@sanity/color'
import {Avatar, AvatarStack} from 'part:@sanity/components/avatar'
import {number, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const colors = [
  {dark: color.blue[400].hex, light: color.blue[500].hex},
  {dark: color.purple[400].hex, light: color.purple[500].hex},
  {dark: color.magenta[400].hex, light: color.magenta[500].hex},
  {dark: color.orange[400].hex, light: color.orange[500].hex},
  {dark: color.yellow[400].hex, light: color.yellow[500].hex},
  {dark: color.cyan[400].hex, light: color.cyan[500].hex},
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
