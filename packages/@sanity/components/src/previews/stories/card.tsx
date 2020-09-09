import WarningIcon from 'part:@sanity/base/warning-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import CardPreview from 'part:@sanity/components/previews/card'
import {boolean, number, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

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

const renderDescription = () => {
  return (
    <span>
      This is the{' '}
      <strong style={{color: 'red'}}>
        <WarningIcon />
        description
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
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0'
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
            transform: 'translate(28%, 43%) rotate(45deg)'
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
  elements: 'Element'
}

export function CardStory() {
  const propType = select('Type of props', options, 'strings')

  if (propType === 'functions') {
    return (
      <CenteredContainer style={{backgroundColor: 'none'}}>
        <div style={{width: '100%', maxWidth: 350}}>
          <Sanity part="part:@sanity/components/previews/card" propTables={[CardPreview]}>
            <CardPreview
              title={renderTitle}
              subtitle={renderSubtitle}
              description={renderDescription}
              status={renderStatus}
              media={renderMedia}
              isPlaceholder={boolean('placeholder', true, 'props')}
              mediaDimensions={{
                width: 300,
                height: 225,
                aspect: number('mediaDimensions.aspect', 4 / 3, 'props'),
                fit: 'crop'
              }}
            >
              {boolean('Custom children', false, 'test') && renderCustomChildren()}
            </CardPreview>
          </Sanity>
        </div>
      </CenteredContainer>
    )
  }

  if (propType === 'elements') {
    return (
      <CenteredContainer style={{backgroundColor: 'none'}}>
        <div style={{width: '100%', maxWidth: 350}}>
          <Sanity part="part:@sanity/components/previews/card" propTables={[CardPreview]}>
            <CardPreview
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
              description={
                <span>
                  This is the long the descriptions that should no be to long, beacuse we will cap
                  it
                </span>
              }
              isPlaceholder={boolean('placeholder', false, 'props')}
              media={boolean('Show image', false) ? renderMedia : undefined}
              status={
                <div>
                  <LinkIcon />
                  <WarningIcon />
                </div>
              }
              mediaDimensions={{
                width: 300,
                height: 225,
                aspect: number('mediaDimensions.aspect', 4 / 3, 'props'),
                fit: 'crop'
              }}
            >
              {boolean('Custom children', false, 'test') && renderCustomChildren()}
            </CardPreview>
          </Sanity>
        </div>
      </CenteredContainer>
    )
  }

  return (
    <CenteredContainer style={{backgroundColor: 'none'}}>
      <div style={{width: '100%', maxWidth: 350}}>
        <Sanity part="part:@sanity/components/previews/card" propTables={[CardPreview]}>
          <CardPreview
            title={text('title', 'Bill Murray', 'props')}
            subtitle={text('subtitle', 'American actor', 'props')}
            description={text(
              'description',
              'William James Murray is an American actor, comedian, and writer. He first gained exposure on Saturday Night Live, a series of performances that earned him his first Emmy Award, and later starred in.',
              'props'
            )}
            status={text('status', '🔔 🐣 👻', 'props')}
            media={boolean('Show image', true, 'test') ? renderMedia : undefined}
            isPlaceholder={boolean('isPlaceholder', false, 'props')}
            mediaDimensions={{
              width: 300,
              height: 225,
              aspect: number('mediaDimensions.aspect', 4 / 3, 'props'),
              fit: 'crop'
            }}
          >
            {boolean('Custom children', false) && renderCustomChildren()}
          </CardPreview>
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
