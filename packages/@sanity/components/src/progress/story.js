/* eslint-disable react/no-multi-comp */
import React from 'react'
import ProgressBar from 'part:@sanity/components/progress/bar'
import ProgressCircle from 'part:@sanity/components/progress/circle'
import {withKnobs, number, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import {storiesOf} from 'part:@sanity/storybook'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Progress')
.addDecorator(withKnobs)
.add(
  'Progress bar',
  () => (
    <Sanity part="part:@sanity/components/progress/bar" propTables={[ProgressBar]}>
      <ProgressBar
        percent={number('Percentage', 10, {range: true, min: 0, max: 100, step: 1})}
        showPercent={boolean('Show percent', false)}
        text={text('text', 'Downloaded 5.1 of 8.2Mb')}
        completed={boolean('completed', false)}
      />
    </Sanity>
  )
)
.add(
  'Progress circle',
  () => (
    <Sanity part="part:@sanity/components/progress/circle" propTables={[ProgressCircle]}>
      <ProgressCircle
        percent={number('Percentage', 10, {range: true, min: 0, max: 100, step: 1})}
        showPercent={boolean('Show percent', false)}
        text={text('text', false)}
        completed={boolean('completed', false)}
      />
    </Sanity>
  )
)
