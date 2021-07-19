import React from 'react'
import Anchor from 'part:@sanity/components/buttons/anchor'

const OpenInSlack = ({value}) => <div>
  <Anchor href={value} target="_blank" rel="noopener noreferrer">Open in Slack</Anchor>
</div>


export default OpenInSlack
