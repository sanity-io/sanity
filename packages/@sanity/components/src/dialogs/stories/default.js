import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean} from 'part:@sanity/storybook/addons/knobs'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

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
        <DialogContent size="medium" padding="medium">
          <h1>With dialog content</h1>
          <p>{paragraph}</p>
        </DialogContent>
      )
    default:
      return 'Minimal'
  }
}

export function DefaultStory() {
  const actions = [
    {
      index: '1',
      title: 'Finish',
      color: 'primary',
      autoFocus: true
    },
    {
      index: '2',
      title: 'Cancel'
    },
    {
      index: '3',
      title: 'Secondary',
      color: 'danger',
      secondary: true
    }
  ]

  const dialogActions = boolean('Show actions', false, 'test') ? actions : []
  const contentTest = select('content', dialogTestContent, 'minimal')
  return (
    <Sanity part="part:@sanity/components/dialogs/default" propTables={[DefaultDialog]}>
      <DefaultDialog
        title={text('title', undefined, 'props')}
        color={select(
          'color',
          ['default', 'danger', 'success', 'info', 'warning'],
          undefined,
          'props'
        )}
        showCloseButton={boolean('showCloseButton', false, 'props')}
        onEscape={action('onEscape')}
        onClose={action('onClose')}
        onAction={action('onAction')}
        actions={dialogActions}
      >
        {contentTest && renderContent(contentTest)}
      </DefaultDialog>
    </Sanity>
  )
}
