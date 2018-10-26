/* eslint-disable react/no-multi-comp */
import React from 'react'
import ProgressBar from 'part:@sanity/components/progress/bar'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import {withKnobs, number, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import {storiesOf} from 'part:@sanity/storybook'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '600px',
  padding: '1rem'
}

storiesOf('Progress')
  .addDecorator(withKnobs)
  .add('Progress bar', () => (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/progress/bar" propTables={[ProgressBar]}>
        <ProgressBar
          isComplete={boolean('isComplete', false, 'props')}
          percent={number('percentage', 10, {range: true, min: 0, max: 100, step: 1}, 'props')}
          showPercent={boolean('showPercent', false, 'props')}
          text={text('text', 'Downloaded 5.1 of 8.2Mb', 'props')}
          isInProgress={boolean('isInProgress', false, 'props')}
        />
      </Sanity>
    </div>
  ))
  .add('Progress circle', () => (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/progress/circle" propTables={[ProgressCircle]}>
        <ProgressCircle
          isComplete={boolean('isComplete', false, 'props')}
          percent={number('percent', 10, {range: true, min: 0, max: 100, step: 1}, 'props')}
          showPercent={boolean('showPercent', true, 'props')}
          text={text('text', 'Uploaded', 'props')}
        />
      </Sanity>
    </div>
  ))
