import Button from 'part:@sanity/components/buttons/default'
import {Popover} from 'part:@sanity/components/popover'
import {select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React, {useCallback, useState} from 'react'
import {Placement} from '../../types'

export function InteractiveStory() {
  const placement = select(
    'Placement',
    {
      'top-start': 'Top start',
      top: 'Top',
      'top-end': 'Top end',
      'right-start': 'Right start',
      right: 'Right',
      'right-end': 'Right end',
      'bottom-start': 'Bottom start',
      bottom: 'Bottom',
      'bottom-end': 'Bottom end',
      'left-start': 'Left start',
      left: 'Left',
      'left-end': 'Left end'
    },
    'bottom',
    'Props'
  )

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Popover]}>
        <Example placement={placement} />
      </Sanity>
    </CenteredContainer>
  )
}

function Example(props: {placement: Placement}) {
  const content = <div>Content</div>
  const [open, setOpen] = useState(false)

  const handleClick = useCallback(() => {
    setOpen(!open)
  }, [open])

  return (
    <Popover content={content} open={open} placement={props.placement}>
      <div>
        <Button onClick={handleClick}>Click to toggle popover</Button>
      </div>
    </Popover>
  )
}
