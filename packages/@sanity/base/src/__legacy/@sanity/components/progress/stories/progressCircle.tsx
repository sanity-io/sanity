import ProgressCircle from 'part:@sanity/components/progress/circle'
import {number, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

const centerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '600px',
  padding: '1rem',
}

export function ProgressCircleStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/progress/circle" propTables={[ProgressCircle]}>
        <ProgressCircle
          isComplete={boolean('isComplete', false, 'props')}
          isInProgress={boolean('isInProgress', false, 'props')}
          percent={number('percent', 10, {range: true, min: 0, max: 100, step: 1}, 'props')}
          showPercent={boolean('showPercent', true, 'props')}
          text={text('text', 'Uploaded', 'props')}
        />
      </Sanity>
    </div>
  )
}
