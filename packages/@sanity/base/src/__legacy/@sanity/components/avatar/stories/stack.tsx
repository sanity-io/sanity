import {hues as sanityHues} from '@sanity/color'
import {Avatar, AvatarStack} from 'part:@sanity/components/avatar'
import {number, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const colors = [
  {dark: sanityHues.blue[400].hex, light: sanityHues.blue[500].hex},
  {dark: sanityHues.purple[400].hex, light: sanityHues.purple[500].hex},
  {dark: sanityHues.magenta[400].hex, light: sanityHues.magenta[500].hex},
  {dark: sanityHues.orange[400].hex, light: sanityHues.orange[500].hex},
  {dark: sanityHues.yellow[400].hex, light: sanityHues.yellow[500].hex},
  {dark: sanityHues.cyan[400].hex, light: sanityHues.cyan[500].hex},
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
