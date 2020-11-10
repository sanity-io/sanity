import WarningIcon from 'part:@sanity/base/warning-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import DefaultPreview from 'part:@sanity/components/previews/default'
import {boolean, number, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'
import {PreviewCard, Stack} from './components'

const renderMedia = () => {
  return <img src="http://www.fillmurray.com/300/300" alt="test" />
}

const renderStatus = () => {
  return (
    <span>
      Status <LinkIcon /> <WarningIcon />
    </span>
  )
}

const renderTitle = (options: {layout: string}) => {
  return (
    <span>
      This <span style={{color: 'green'}}>is</span> a <strong>title</strong>
      &nbsp;in the layout {options.layout}
    </span>
  )
}

const renderSubtitle = () => {
  return (
    <span>
      This is a{' '}
      <strong style={{color: 'red'}}>
        <WarningIcon />
        subtitle
      </strong>
    </span>
  )
}

const renderCustomChildren = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            fontSize: '10px',
            textTransform: 'uppercase',
            top: '0',
            right: '0',
            fontWeight: 700,
            boxShadow: '0 0 5px rgba(0,0,0,0.2)',
            backgroundColor: 'yellow',
            padding: '0.2em 3em',
            transform: 'translate(28%, 43%) rotate(45deg)',
          }}
        >
          New
        </div>
      </div>
    </div>
  )
}

const options = {
  functions: 'Functions',
  strings: 'Strings',
  elements: 'Element',
}

export function DefaultStory() {
  const propType = select('Type of props', options, 'strings')

  if (propType === 'functions') {
    return (
      <CenteredContainer style={{backgroundColor: 'none'}}>
        <div style={{width: '100%', maxWidth: 350}}>
          <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
            <Stack>
              <PreviewCard>
                <DefaultPreview
                  title={renderTitle}
                  subtitle={renderSubtitle}
                  status={renderStatus}
                  media={renderMedia}
                  isPlaceholder={boolean('placeholder', false, 'props')}
                  progress={number(
                    'progress',
                    undefined,
                    {range: true, min: 0, max: 100, step: 1},
                    'props'
                  )}
                >
                  {boolean('Custom children', false) && renderCustomChildren()}
                </DefaultPreview>
              </PreviewCard>
            </Stack>
          </Sanity>
        </div>
      </CenteredContainer>
    )
  }

  if (propType === 'elements') {
    return (
      <CenteredContainer style={{backgroundColor: 'none'}}>
        <div style={{width: '100%', maxWidth: 350}}>
          <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
            <Stack>
              <PreviewCard>
                <DefaultPreview
                  title={
                    <span>
                      This <span style={{color: 'green'}}>is</span> a <strong>test</strong>
                    </span>
                  }
                  subtitle={
                    <span>
                      This is a <strong style={{color: 'red'}}>subtitle</strong>
                    </span>
                  }
                  isPlaceholder={boolean('placeholder', false, 'props')}
                  media={boolean('Show image', true, 'test') ? renderMedia : undefined}
                  status={
                    <div>
                      <LinkIcon />
                      <WarningIcon />
                    </div>
                  }
                  progress={number(
                    'progress',
                    undefined,
                    {range: true, min: 0, max: 100, step: 1},
                    'props'
                  )}
                >
                  {boolean('Custom children', false, 'test') && renderCustomChildren()}
                </DefaultPreview>
              </PreviewCard>
            </Stack>
          </Sanity>
        </div>
      </CenteredContainer>
    )
  }

  return (
    <CenteredContainer style={{backgroundColor: 'none'}}>
      <div style={{width: '100%', maxWidth: 350}}>
        <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
          <Stack>
            <PreviewCard>
              <DefaultPreview
                title={text(
                  'title',
                  'This is the title an it is very long, so long that it should be ellipsed',
                  'props'
                )}
                subtitle={text(
                  'subtitle',
                  `This is the title an it is very long, so long that it should be ellipsed.
             This is the title an it is very long, so long that it should be ellipsed`,
                  'props'
                )}
                status={text('status', '🔔 🐣 👻', 'props')}
                media={boolean('Show image', true, 'props') ? renderMedia : undefined}
                isPlaceholder={boolean('placeholder', false, 'props')}
                progress={number(
                  'progress',
                  undefined,
                  {range: true, min: 0, max: 100, step: 1},
                  'props'
                )}
              >
                {boolean('Custom children', false, 'test') && renderCustomChildren()}
              </DefaultPreview>
            </PreviewCard>
          </Stack>
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
