import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import ConfirmDialog from 'part:@sanity/components/dialogs/confirm'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import React from 'react'
import {DialogAction} from '../types'

const chance = new Chance()

const dialogTestContent = {
  minimal: 'minimal',
  paragraph: 'paragraph',
  longtext: 'longtext',
  example: 'example with dialogcontent'
}

const paragraph = chance.paragraph()
const paragraphs = range(0, 20).map(i => <p key={i}>{chance.paragraph()}</p>)

function renderContent(type) {
  switch (type) {
    case 'paragraph':
      return <p>{paragraph}</p>
    case 'longtext':
      return <div>{paragraphs}</div>
    case 'example':
      return (
        <>
          <h1>With dialog content</h1>
          <p>{paragraph}</p>
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
  const placement = select(
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
    'props'
  )

  const refStyles: React.CSSProperties = {
    position: 'absolute',
    top: `${top}%`,
    left: `${left}%`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: 'lime'
  }

  const contentTest = select('content', dialogTestContent, 'minimal')

  if (window) {
    // Triggers update of popper.js (only reacts to scroll and resize by default)
    const event = document.createEvent('HTMLEvents')
    event.initEvent('resize', true, false)
    window.dispatchEvent(event)
  }

  return (
    <Sanity part="part:@sanity/components/dialogs/confirm" propTables={[ConfirmDialog]}>
      <div style={refStyles}>
        <PopOverDialog
          actions={boolean('has actions', false, 'test') ? actions : []}
          color={select('color', [undefined, 'danger', 'default'], undefined, 'props')}
          title={text('Title', 'Title', 'props')}
          padding={select(
            'Padding',
            [undefined, 'none', 'small', 'medium', 'large'],
            undefined,
            'props'
          )}
          onClose={boolean('Has onClose', false, 'test') ? action('onClose') : undefined}
          placement={placement}
          // size="medium"
        >
          {contentTest && renderContent(contentTest)}
        </PopOverDialog>
        Reference element
      </div>
    </Sanity>
  )
}
