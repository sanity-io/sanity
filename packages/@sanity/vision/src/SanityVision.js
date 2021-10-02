import React from 'react'
import sanityClient from 'part:@sanity/base/client'
import schema from 'part:@sanity/base/schema?'
import Vision from './Vision'

const client = sanityClient.withConfig({apiVersion: '1'})

// Used in Sanity project
function SanityVision() {
  return <Vision client={client} schema={schema} />
}

export default SanityVision
