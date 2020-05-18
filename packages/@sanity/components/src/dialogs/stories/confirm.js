import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select} from 'part:@sanity/storybook/addons/knobs'
import DialogContent from 'part:@sanity/components/dialogs/content'
import ConfirmDialog from 'part:@sanity/components/dialogs/confirm'
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

export function ConfirmStory() {
  const contentTest = select('content', dialogTestContent, 'minimal')
  return (
    <Sanity part="part:@sanity/components/dialogs/confirm" propTables={[ConfirmDialog]}>
      <ConfirmDialog
        color={select(
          'color',
          ['default', 'danger', 'success', 'info', 'warning'],
          undefined,
          'props'
        )}
        confirmColor={select('confirmColor', [undefined, 'danger', 'success'], undefined, 'props')}
        cancelColor={select('cancelColor', [undefined, 'danger', 'success'], undefined, 'props')}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
        confirmButtonText={text('confirmButtonText', 'Yes, delete', 'props')}
        cancelButtonText={text('cancelButtonText', undefined, 'props')}
        title={text('title', 'Confirm', 'props')}
      >
        {contentTest && renderContent(contentTest)}
      </ConfirmDialog>
    </Sanity>
  )
}
