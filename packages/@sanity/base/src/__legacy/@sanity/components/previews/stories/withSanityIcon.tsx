import WarningIcon from 'part:@sanity/base/warning-icon'
import DefaultPreview from 'part:@sanity/components/previews/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'
import {PreviewCard, Stack} from './components'

export function WithSanityIconStory() {
  return (
    <CenteredContainer style={{backgroundColor: 'none'}}>
      <div style={{width: '100%', maxWidth: 350}}>
        <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
          <Stack>
            <PreviewCard>
              <DefaultPreview title="Title" subtitle="Subtitle" media={<WarningIcon />} />
            </PreviewCard>
          </Stack>
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
