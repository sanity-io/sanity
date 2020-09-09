import FileIcon from 'part:@sanity/base/file-icon'
import CreateDocumentPreview from 'part:@sanity/components/previews/create-document'
import {text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'
import {PreviewCard, Stack} from './components'

export function CreateDocumentStory() {
  return (
    <CenteredContainer style={{backgroundColor: 'none'}}>
      <div style={{width: '100%', maxWidth: 350}}>
        <Sanity
          part="part:@sanity/components/previews/create-document"
          propTables={[CreateDocumentPreview]}
        >
          <Stack>
            <PreviewCard>
              <CreateDocumentPreview
                params={{intent: 'create', template: 'test'}}
                title={text('title', 'Movie', 'props')}
                subtitle={text('subtitle', 'Sci-fi', 'props')}
                description={text(
                  'description',
                  'Science fiction is a genre of speculative fiction that has been called the "literature of ideas". It typically deals with imaginative and futuristic concepts such as advanced science and technology, time travel, parallel universes, fictional worlds, space exploration, and extraterrestrial life.',
                  'props'
                )}
                icon={FileIcon}
              />
            </PreviewCard>
          </Stack>
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
