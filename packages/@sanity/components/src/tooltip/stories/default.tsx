import {PortalProvider} from 'part:@sanity/components/portal'
import {Tooltip} from 'part:@sanity/components/tooltip'
import {boolean, select, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React, {useState, useEffect} from 'react'
import {Placement} from '../../types'

export function DefaultStory() {
  const children = text('Children', 'Reference', 'Props')
  const placement = select(
    'Placement',
    {
      'top-start': 'Top start',
      top: 'Top',
      'top-end': 'Top end',
      'right-start': 'Right start',
      right: 'Right',
      'right-end': 'Right end',
      'bottom-start': 'Bottom start',
      bottom: 'Bottom',
      'bottom-end': 'Bottom end',
      'left-start': 'Left start',
      left: 'Left',
      'left-end': 'Left end'
    },
    'bottom',
    'Props'
  )
  const portal = boolean('Portal', false, 'Props')
  const tone = select(
    'Tone',
    {
      '': '(none)',
      navbar: 'Navbar'
    },
    '',
    'Props'
  )

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Tooltip]}>
        <Example content={<>{children}</>} placement={placement} portal={portal} tone={tone} />
      </Sanity>
    </CenteredContainer>
  )
}

function Example({
  content,
  placement,
  portal,
  tone
}: {
  content: React.ReactNode
  placement: Placement
  portal: boolean
  tone: 'navbar' | undefined
}) {
  const [portalElement] = useState(() => {
    const el = document.createElement('div')

    el.setAttribute('data-portal', '')

    return el
  })

  useEffect(() => {
    document.body.appendChild(portalElement)
    return () => {
      document.body.removeChild(portalElement)
    }
  }, [portalElement])

  return (
    <PortalProvider element={portalElement}>
      <Tooltip content={content} placement={placement} portal={portal} tone={tone || undefined}>
        <span style={{display: 'inline-block'}}>Hover me</span>
      </Tooltip>
    </PortalProvider>
  )
}
