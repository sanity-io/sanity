import {Portal, PortalProvider} from 'part:@sanity/components/portal'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React, {useRef, useEffect} from 'react'

export function DefaultStory() {
  return (
    <Sanity part="part:@sanity/components/dialogs/default" propTables={[Portal]}>
      <PortalExample />
    </Sanity>
  )
}

function PortalExample() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const portalRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.appendChild(portalRef.current)
    }

    return () => {
      if (rootRef.current) {
        rootRef.current.removeChild(portalRef.current)
      }
    }
  }, [])

  return (
    <PortalProvider element={portalRef.current}>
      <div ref={rootRef}>Portal demo:</div>

      <Portal>
        <div
          style={{
            background: 'rgba(255, 0, 0, 0.1)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{background: '#fff', padding: 20}}>Hello from portal</div>
        </div>
      </Portal>
    </PortalProvider>
  )
}
