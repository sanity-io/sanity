import ProgressBar from 'part:@sanity/components/progress/bar'
import {number, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function ProgressBarStory() {
  return (
    <CenteredContainer>
      <div style={{width: '100%', maxWidth: 350}}>
        <Sanity part="part:@sanity/components/progress/bar" propTables={[ProgressBar]}>
          <ProgressBar
            isComplete={boolean('isComplete', false, 'props')}
            isInProgress={boolean('isInProgress', false, 'props')}
            percent={number('percentage', 10, {range: true, min: 0, max: 100, step: 1}, 'props')}
            showPercent={boolean('showPercent', false, 'props')}
            text={text('text', 'Downloaded 5.1 of 8.2Mb', 'props')}
          />
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
