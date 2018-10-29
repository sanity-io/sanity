/* eslint-disable react/no-multi-comp, complexity */
import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultPreview from 'part:@sanity/components/previews/default'
import DetailPreview from 'part:@sanity/components/previews/detail'
import InlinePreview from 'part:@sanity/components/previews/inline'
import MediaPreview from 'part:@sanity/components/previews/media'
import CardPreview from 'part:@sanity/components/previews/card'
import BlockPreview from 'part:@sanity/components/previews/block'
import BlockImagePreview from 'part:@sanity/components/previews/block-image'
import {withKnobs, boolean, number, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import WarningIcon from 'part:@sanity/base/warning-icon'
import LinkIcon from 'part:@sanity/base/link-icon'

const renderMedia = dimensions => {
  return <img src="http://www.fillmurray.com/300/300" alt="test" />
}

const renderStatus = options => {
  return (
    <span>
      Status <LinkIcon /> <WarningIcon />
    </span>
  )
}

const renderTitle = options => {
  return (
    <span>
      This <span style={{color: 'green'}}>is</span> a <strong>title</strong>
      &nbsp;in the layout {options.layout}
    </span>
  )
}

const renderSubtitle = options => {
  return (
    <span>
      This is a{' '}
      <strong style={{color: 'red'}}>
        <WarningIcon />subtitle
      </strong>
    </span>
  )
}

const renderDescription = options => {
  return (
    <span>
      This is the{' '}
      <strong style={{color: 'red'}}>
        <WarningIcon />description
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
            fontWeight: '700',
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

const style = {
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#eee',
  padding: '1em'
}

const innerStyle = {
  border: '1px dotted #ccc',
  width: '500px'
}

const centered = function(storyFn) {
  return (
    <div style={style}>
      <div style={innerStyle}>{storyFn()}</div>
    </div>
  )
}

const options = {
  functions: 'Functions',
  strings: 'Strings',
  elements: 'Element'
}

storiesOf('Previews')
  .addDecorator(centered)
  .addDecorator(withKnobs)
  .add('Default', () => {
    const propType = select('Type of props', options, 'strings')

    if (propType === 'functions') {
      return (
        <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
          <DefaultPreview
            title={renderTitle}
            subtitle={renderSubtitle}
            description={renderDescription}
            status={renderStatus}
            media={renderMedia}
            isPlaceholder={boolean('placeholder', false, 'props')}
            date={new Date()}
            progress={number(
              'progress',
              undefined,
              {range: true, min: 0, max: 100, step: 1},
              'props'
            )}
          >
            {boolean('Custom children', false) && renderCustomChildren()}
          </DefaultPreview>
        </Sanity>
      )
    }

    if (propType === 'elements') {
      return (
        <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
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
            description={
              <span>
                This is the long the descriptions that should no be to long, beacuse we will cap it
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
            date={new Date()}
            progress={number(
              'progress',
              undefined,
              {range: true, min: 0, max: 100, step: 1},
              'props'
            )}
          >
            {boolean('Custom children', false, 'test') && renderCustomChildren()}
          </DefaultPreview>
        </Sanity>
      )
    }

    return (
      <Sanity part="part:@sanity/components/previews/default" propTables={[DefaultPreview]}>
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
          description={text(
            'description',
            'This is the long the descriptions that should no be to long, beacuse we will cap it',
            'props'
          )}
          status={text('status', '🔔 🐣 👻', 'props')}
          media={boolean('Show image', true, 'props') ? renderMedia : undefined}
          isPlaceholder={boolean('placeholder', false, 'props')}
          date={new Date()}
          progress={number(
            'progress',
            undefined,
            {range: true, min: 0, max: 100, step: 1},
            'props'
          )}
        >
          {boolean('Custom children', false, 'test') && renderCustomChildren()}
        </DefaultPreview>
      </Sanity>
    )
  })

  .add('Card', () => {
    const propType = select('Type of props', options, 'strings')

    if (propType === 'functions') {
      return (
        <Sanity part="part:@sanity/components/previews/card" propTables={[CardPreview]}>
          <CardPreview
            title={renderTitle}
            subtitle={renderSubtitle}
            description={renderDescription}
            date={boolean('date', true, 'test') ? new Date() : false}
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
      )
    }

    if (propType === 'elements') {
      return (
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
                This is the long the descriptions that should no be to long, beacuse we will cap it
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
            date={boolean('date', true) ? new Date() : false}
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
      )
    }

    return (
      <Sanity part="part:@sanity/components/previews/card" propTables={[CardPreview]}>
        <CardPreview
          title={text('title', 'This is the title', 'props')}
          subtitle={text('subtitle', 'This is the subtitle', 'props')}
          description={text(
            'description',
            'This is the long the descriptions that should no be to long, beacuse we will cap it',
            'props'
          )}
          date={boolean('date', true, 'test') ? new Date() : false}
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
    )
  })

  .add('Detail', () => {
    const propType = select('Type of props', options, 'strings')

    if (propType === 'functions') {
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <DetailPreview
            title={renderTitle}
            subtitle={renderSubtitle}
            description={renderDescription}
            status={renderStatus}
            date={new Date()}
            media={renderMedia}
            isPlaceholder={boolean('isplaceholder', false, 'props')}
          >
            {boolean('Custom children', false, 'test') && renderCustomChildren()}
          </DetailPreview>
        </Sanity>
      )
    }

    if (propType === 'elements') {
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <DetailPreview
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
                This is the long the descriptions that should no be to long, beacuse we will cap it
              </span>
            }
            status={
              <div>
                <LinkIcon />
                <WarningIcon />
              </div>
            }
            isPlaceholder={boolean('placeholder', false, 'props')}
            media={boolean('Show image', false, 'test') ? renderMedia : undefined}
            date={boolean('date', true, 'test') ? new Date() : false}
          >
            {boolean('Custom children', false, 'test') && renderCustomChildren()}
          </DetailPreview>
        </Sanity>
      )
    }

    return (
      <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
        <DetailPreview
          title={text('title (prop)', 'This is the title', 'props')}
          subtitle={text('subtitle', 'This is the subtitle', 'props')}
          description={text(
            'description',
            'This is the long the descriptions that should no be to long, beacuse we will cap it',
            'props'
          )}
          status={text('status', '🔔 🐣 👻', 'props')}
          date={new Date()}
          media={renderMedia}
          isPlaceholder={boolean('isplaceholder', false, 'props')}
        >
          {boolean('Custom children', false, 'test') && renderCustomChildren()}
        </DetailPreview>
      </Sanity>
    )
  })

  .add('Media', () => {
    return (
      <Sanity part="part:@sanity/components/previews/media" propTables={[MediaPreview]}>
        <MediaPreview
          title={text('title (prop)', 'This is the title', 'props')}
          subtitle={text('subtitle (prop)', 'This is the subtitle', 'props')}
          description={text(
            'description',
            'This is the long the descriptions that should no be to long, beacuse we will cap it',
            'props'
          )}
          date={boolean('date', true, 'test') ? new Date() : false}
          media={renderMedia}
          isPlaceholder={boolean('isplaceholder', false, 'props')}
        >
          {boolean('Custom children', false, 'test') && renderCustomChildren()}
        </MediaPreview>
      </Sanity>
    )
  })

  .add('Inline', () => {
    const propType = select('Type of props', options, 'strings')
    if (propType === 'functions') {
      return (
        <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
          <p>
            This is a text, and suddenly a inline preview appearst before
            <InlinePreview
              title={renderTitle}
              media={renderMedia}
              isPlaceholder={boolean('isPlaceholder', false, 'props')}
            >
              {boolean('Custom children', false, 'test') && <span>This is custom children</span>}
            </InlinePreview>
            this word.
          </p>
        </Sanity>
      )
    }
    if (propType === 'elements') {
      return (
        <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
          <p>
            This is a text, and suddenly a inline preview appearst before
            <InlinePreview
              title={<span>title</span>}
              media={renderMedia}
              isPlaceholder={boolean('isPlaceholder', false, 'props')}
            >
              {boolean('Custom children', false, 'test') && <span>This is custom children</span>}
            </InlinePreview>
            this word.
          </p>
        </Sanity>
      )
    }
    return (
      <Sanity part="part:@sanity/components/previews/inline" propTables={[InlinePreview]}>
        <p>
          This is a text, and suddenly a inline preview appearst before
          <InlinePreview
            title={text('title', 'This is the title', 'props')}
            media={renderMedia}
            date={boolean('date', true, 'test') ? new Date() : false}
            isPlaceholder={boolean('isPlaceholder', false, 'props')}
          >
            {boolean('Custom children', false, 'test') && <span>This is custom children</span>}
          </InlinePreview>
          this word.
        </p>
      </Sanity>
    )
  })

  .add('Block', () => {
    const propType = select('Type of props', options, 'strings')

    if (propType === 'functions') {
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <BlockPreview
            title={renderTitle}
            subtitle={renderSubtitle}
            description={renderDescription}
            status={renderStatus}
            date={new Date()}
            media={renderMedia}
            isPlaceholder={boolean('isplaceholder', false, 'props')}
          >
            {boolean('Custom children', false, 'test') && renderCustomChildren()}
          </BlockPreview>
        </Sanity>
      )
    }

    if (propType === 'elements') {
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <BlockPreview
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
                This is the long the descriptions that should no be to long, beacuse we will cap it
              </span>
            }
            status={
              <div>
                <LinkIcon />
                <WarningIcon />
              </div>
            }
            isPlaceholder={boolean('placeholder', false, 'props')}
            media={boolean('Show image', false, 'test') ? renderMedia : undefined}
            date={boolean('date', true, 'test') ? new Date() : false}
          >
            {boolean('Custom children', false, 'test') && renderCustomChildren()}
          </BlockPreview>
        </Sanity>
      )
    }

    return (
      <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
        <BlockPreview
          title={text('title', 'This is the title', 'props')}
          subtitle={text('subtitle', 'This is the subtitle', 'props')}
          description={text('description', 'This is the description', 'props')}
          status={text('status', 'status', 'props')}
          date={new Date()}
          media={renderMedia}
          isPlaceholder={boolean('isplaceholder', false, 'props')}
        >
          {boolean('Custom children', false, 'test') && renderCustomChildren()}
        </BlockPreview>
      </Sanity>
    )
  })
  .add('Block image', () => {
    const propType = select('Type of props', options, 'strings')

    if (propType === 'functions') {
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <BlockImagePreview
            title={renderTitle}
            subtitle={renderSubtitle}
            description={boolean('description', false, 'props') ? renderDescription : ''}
            status={renderStatus}
            date={new Date()}
            media={renderMedia}
            isPlaceholder={boolean('isplaceholder', false, 'props')}
          >
            {boolean('Custom children', false) && renderCustomChildren()}
          </BlockImagePreview>
        </Sanity>
      )
    }

    if (propType === 'elements') {
      return (
        <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
          <BlockImagePreview
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
                This is the long the <strong style={{color: 'magenta'}}>description</strong>
                &nbsp; that should no be to long, beacuse we will cap it. But this is an element,
                and that is why it is har to cap. This is the long the{' '}
                <strong style={{color: 'magenta'}}>description</strong>
                &nbsp; that should no be to long, beacuse we will cap it. But this is an element,
                and that is why it is har to cap.
              </span>
            }
            status={
              <div>
                <LinkIcon />
                <WarningIcon />
              </div>
            }
            isPlaceholder={boolean('placeholder', false, 'props')}
            media={boolean('Show image', false, 'test') ? renderMedia : undefined}
            date={boolean('date', true, 'test') ? new Date() : false}
          >
            {boolean('Custom children', false, 'props') && renderCustomChildren()}
          </BlockImagePreview>
        </Sanity>
      )
    }

    return (
      <Sanity part="part:@sanity/components/previews/detail" propTables={[DetailPreview]}>
        <BlockImagePreview
          title={text('title', 'This is the title', 'props')}
          subtitle={text('subtitle', 'This is the subtitle', 'props')}
          description={text('description', 'This is the description', 'props')}
          status={text('status', '🔔 🐣 👻', 'props')}
          date={boolean('date', true) ? new Date() : false}
          media={renderMedia}
          isPlaceholder={boolean('isplaceholder', false, 'props')}
        >
          {boolean('Custom children', false) && renderCustomChildren()}
        </BlockImagePreview>
      </Sanity>
    )
  })
