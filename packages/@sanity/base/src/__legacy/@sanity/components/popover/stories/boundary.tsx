import {Popover} from 'part:@sanity/components/popover'
import {boolean, select, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React, {useRef} from 'react'

export function BoundaryStory() {
  const boundary = select(
    'Boundary',
    {viewport: 'Viewport', wrapper: 'Wrapper'},
    'viewport',
    'Props'
  )
  const content = text('Content', 'Content', 'Props')
  const open = boolean('Open', true, 'Props')
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
      'left-end': 'Left end',
    },
    'bottom',
    'Props'
  )

  return (
    <Sanity part="part:@sanity/components/dialogs/default" propTables={[Popover]}>
      <CenteredContainer>
        <PopoverExample boundary={boundary} content={content} open={open} placement={placement} />
      </CenteredContainer>
    </Sanity>
  )
}

function PopoverExample({boundary, content, open, placement}: any) {
  const boundaryRef = useRef(null)

  const popoverContent = content ? <div style={{padding: '1em'}}>{content}</div> : null

  return (
    <div ref={boundaryRef} style={{minWidth: 200, minHeight: 200, outline: '1px solid red'}}>
      <Popover
        boundaryElement={boundary === 'wrapper' ? boundaryRef.current : null}
        content={popoverContent}
        open={open}
        placement={placement}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '0.25em',
            background: 'rgba(127, 127, 127, 0.5)',
          }}
        >
          Reference
        </span>
      </Popover>
    </div>
  )
}
