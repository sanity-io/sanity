import InlinePreview from 'part:@sanity/components/previews/inline'
import {boolean, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const renderMedia = () => {
  return <img src="http://www.fillmurray.com/300/300" alt="test" />
}

const renderTitle = (options: {layout: string}) => {
  return (
    <span>
      This <span style={{color: 'green'}}>is</span> a <strong>title</strong>
      &nbsp;in the layout {options.layout}
    </span>
  )
}

const options = {
  functions: 'Functions',
  strings: 'Strings',
  elements: 'Element'
}

export function InlineStory() {
  const propType = select('Type of props', options, 'strings')

  if (propType === 'functions') {
    return (
      <CenteredContainer>
        <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
          <p>
            This is a text, and suddenly a inline preview appearst before
            <InlinePreview title={renderTitle} media={renderMedia}>
              {boolean('Custom children', false, 'test') && <span>This is custom children</span>}
            </InlinePreview>
            this word.
          </p>
        </Sanity>
      </CenteredContainer>
    )
  }

  if (propType === 'elements') {
    return (
      <CenteredContainer>
        <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
          <p>
            This is a text, and suddenly a inline preview appearst before
            <InlinePreview title={<span>title</span>} media={renderMedia}>
              {boolean('Custom children', false, 'test') && <span>This is custom children</span>}
            </InlinePreview>
            this word.
          </p>
        </Sanity>
      </CenteredContainer>
    )
  }

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
        <p>
          This is a text, and suddenly an inline preview appears before{' '}
          <InlinePreview title={text('title', 'This is the title', 'props')} media={renderMedia}>
            {boolean('Custom children', false, 'test') && <span>This is custom children</span>}
          </InlinePreview>{' '}
          this word.
        </p>
      </Sanity>
    </CenteredContainer>
  )
}
