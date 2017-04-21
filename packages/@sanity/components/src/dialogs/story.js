import React from 'react'
import {storiesOf, action, linkTo} from 'part:@sanity/storybook'
import {withKnobs, text, select, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import Button from 'part:@sanity/components/buttons/default'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const style = {
  position: 'absolute',
  fontSize: '2em',
  zIndex: '-1'
}

const backgroundStuff = function (storyFn) {
  return (
    <div>
      <div style={style}>
        Lorem Ipsum is simply dummy text of the printing and typesetting industry.
        Lorem Ipsum has been the industrys standard dummy text ever since the 1500s,
        when an unknown printer took a galley of type and scrambled it to make a type specimen book.
        It has survived not only five centuries, but also the leap into electronic typesetting,
        remaining essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop
        publishing software like Aldus PageMaker including versions of Lorem Ipsum.
      </div>
      {storyFn()}
    </div>
  )
}

storiesOf('Dialogs')
.addDecorator(backgroundStuff)
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    const actions = [
      {
        index: '1',
        title: 'Finish'
      },
      {
        index: '2',
        title: 'Cancel',
      },
      {
        index: '3',
        title: 'Secondary',
        kind: 'secondary'
      }
    ]

    const dialogActions = boolean('has actions', false) ? actions : false

    return (
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[DefaultDialog]}>
        <div>
          <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
          <DefaultDialog
            title={text('title', 'This is the title')}
            isOpen={boolean('is Open', true)}
            showHeader={boolean('Show Header', false)}
            kind={select('Kind', [false, 'danger', 'success', 'info', 'warning', false])}
            onClose={action('onClose')}
            actions={object('actions', dialogActions)}
          >
            {text('content', 'This is the content')}
          </DefaultDialog>
        </div>
      </Sanity>
    )
  }
)

.add(
  'Fullscreen',
  () => {
    return (
      <Sanity part="part:@sanity/components/dialogs/fullscreen" propTables={[FullscreenDialog]}>
        <div>
          <Button onClick={linkTo('Dialogs', 'Fullscreen (open)')}>Open fullscreen dialog</Button>
          <FullscreenDialog
            title={text('title', 'This is the title')}
            onClose={action('onClose')}
            kind={select('Kind', [false, 'danger', 'success', 'info', 'warning'])}
            centered={boolean('Centered', false)}
            isOpen={boolean('is Open', true)}
          >
            {text('content', 'This is the content')}
          </FullscreenDialog>
        </div>
      </Sanity>
    )
  }
)
