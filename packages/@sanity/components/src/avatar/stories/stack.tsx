import {Avatar, AvatarStack} from 'part:@sanity/components/avatar'
import {number, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function StackStory() {
  const props = {
    maxLength: number('Max. length', 4, 'Props'),
    size: select(
      'Size',
      {
        small: 'Small',
        medium: 'Medium',
        large: 'Large'
      },
      'small',
      'Props'
    )
  }

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[AvatarStack]}>
        <AvatarStack {...props}>
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
          <Avatar color="cyan" initials="cy" />
          <Avatar color="magenta" initials="ma" />
          <Avatar color="#c90" initials="ye" />
          <Avatar color="#06f" initials="bl" />
        </AvatarStack>
      </Sanity>
    </CenteredContainer>
  )
}
