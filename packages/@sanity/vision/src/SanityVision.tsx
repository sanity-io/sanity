import React from 'react'
import sanityClient from 'part:@sanity/base/client'
import Button from 'part:@sanity/components/buttons/default'
import schema from 'part:@sanity/base/schema?'
import Vision from './Vision'

import visionGui from './css/visionGui.css'

const components = {Button}

const styles = {visionGui}

const client = sanityClient.withConfig({apiVersion: '1'})

// Used in Sanity project
function SanityVision() {
  return <Vision styles={styles} components={components} client={client} schema={schema || null} />
}

export default SanityVision
