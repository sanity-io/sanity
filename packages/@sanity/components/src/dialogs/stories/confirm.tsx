import Chance from 'chance'
import {range} from 'lodash'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select} from 'part:@sanity/storybook/addons/knobs'
import ConfirmDialog from 'part:@sanity/components/dialogs/confirm'
import {PortalProvider} from 'part:@sanity/components/portal'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useEffect, useRef} from 'react'

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

export function ConfirmStory() {
  const contentTest = select('Content', dialogTestContent, 'minimal')

  return (
    <Sanity part="part:@sanity/components/dialogs/confirm" propTables={[ConfirmDialog]}>
      <DialogExample
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
        size="medium"
        padding="medium"
      >
        {contentTest && renderContent(contentTest)}
      </DialogExample>
    </Sanity>
  )
}

function DialogExample(props) {
  const {children, ...restProps} = props
  const portalRef = useRef(document.createElement('div'))

  useEffect(() => {
    portalRef.current.setAttribute('data-portal', '')

    document.body.appendChild(portalRef.current)

    return () => {
      document.body.removeChild(portalRef.current)
    }
  }, [])

  return (
    <PortalProvider element={portalRef.current}>
      <ConfirmDialog {...restProps}>{children}</ConfirmDialog>
    </PortalProvider>
  )
}
