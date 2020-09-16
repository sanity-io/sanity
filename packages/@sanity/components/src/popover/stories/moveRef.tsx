import {Popover} from 'part:@sanity/components/popover'
import {select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React, {useRef} from 'react'

export function MoveRefStory() {
  const refIndex = select('Reference element', {'0': 'First', '1': 'Second'}, '0', 'Debug')

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Popover]}>
        <PopoverExample refIndex={Number(refIndex)} />
      </Sanity>
    </CenteredContainer>
  )
}

function PopoverExample({refIndex}: {refIndex: number}) {
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const open = true
  const placement = 'bottom'
  const ref = refIndex === 0 ? ref1 : ref2

  const popoverContent = <div style={{padding: '1em'}}>popover content</div>

  return (
    <Popover
      content={popoverContent}
      open={open}
      placement={placement}
      style={{transition: 'transform 200ms'}}
      targetElement={ref.current}
    >
      <div>
        <span
          ref={ref1}
          style={{
            display: 'inline-block',
            padding: '0.25em',
            background: 'rgba(127, 127, 127, 0.5)'
          }}
        >
          reference 1
        </span>

        <span
          ref={ref2}
          style={{
            display: 'inline-block',
            padding: '0.25em',
            background: 'rgba(127, 127, 127, 0.5)'
          }}
        >
          reference 2
        </span>
      </div>
    </Popover>
  )
}
