import React from 'react'
import Fieldset from 'part:@sanity/components/fieldsets/default'

export default ({ level, type, value }) => (
  <Fieldset level={level} legend={type.title} description={type.description}>
    <img src={value} alt={type.title} />
  </Fieldset>
)
