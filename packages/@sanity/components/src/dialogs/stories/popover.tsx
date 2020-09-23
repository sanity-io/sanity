import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useState} from 'react'
import {DialogAction} from '../types'

const chance = new Chance()

const dialogTestContent = {
  minimal: 'minimal',
  paragraph: 'paragraph',
  longtext: 'longtext',
  example: 'example with dialogcontent'
}

const paragraph = chance.paragraph()
const paragraphs = range(0, 20).map(i => (
  <p key={i} style={{margin: 0}}>
    {chance.paragraph()}
  </p>
))

function renderContent(type) {
  switch (type) {
    case 'paragraph':
      return <p style={{margin: 0}}>{paragraph}</p>
    case 'longtext':
      return <div>{paragraphs}</div>
    case 'example':
      return (
        <>
          <h1 style={{margin: 0}}>With dialog content</h1>
          <p style={{margin: 0}}>{paragraph}</p>
        </>
      )
    default:
      return 'Minimal'
  }
}

export function PopoverStory() {
  const actions: DialogAction[] = [
    {
      index: 1,
      color: 'success',
      title: 'Please click me',
      autoFocus: true
    }
  ]

  const percentRange = {
    range: true,
    min: 0,
    max: 100,
    step: 0.1
  }

  const sizeRange = {
    range: true,
    min: 0,
    max: 1000,
    step: 1
  }

  const left = number('Reference left', 50, percentRange, 'test')
  const top = number('Reference top', 50, percentRange, 'test')
  const width = number('Reference width', 150, sizeRange, 'test')
  const height = number('Reference height', 150, sizeRange, 'test')

  const refStyles: React.CSSProperties = {
    position: 'absolute',
    top: `${top}%`,
    left: `${left}%`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: 'lime'
  }

  const contentTest = select('content', dialogTestContent, 'minimal')

  const props = {
    actions: boolean('Actions', false, 'test') ? actions : [],
    color: select('Color', [undefined, 'danger', 'default'], undefined, 'Props'),
    onClose: boolean('Closeable', false, 'test') ? action('onClose') : undefined,
    hasAnimation: boolean('Animate in', false, 'Props'),
    onAction: action('onAction'),
    onClickOutside: action('onClickOutside'),
    padding: select('Padding', [undefined, 'none', 'small', 'medium', 'large'], undefined, 'Props'),
    placement: select(
      'Placement',
      [
        'auto',
        'top',
        'right',
        'bottom',
        'left',
        'auto-start',
        'top-start',
        'right-start',
        'bottom-start',
        'left-start',
        'auto-end',
        'top-end',
        'right-end',
        'bottom-end',
        'left-end'
      ],
      'auto',
      'Props'
    ),
    title: text('Title', 'Title', 'Props'),
    size: select(
      'Size',
      {
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        auto: 'Auto'
      },
      'auto',
      'Props'
    ),
    useOverlay: boolean('Use overlay', false, 'Props')
  }

  return (
    <Sanity part="part:@sanity/components/dialogs/popover" propTables={[PopoverDialog]}>
      <Example
        {...props}
        content={contentTest && renderContent(contentTest)}
        refStyles={refStyles}
      />
    </Sanity>
  )
}

function Example({content, refStyles, ...props}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <PopoverDialog {...props} referenceElement={element}>
        {content}
      </PopoverDialog>

      <div ref={setElement} style={refStyles}>
        Reference element
      </div>
    </>
  )
}
