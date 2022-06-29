import {useBoolean, useSelect, useString, useText} from '@sanity/ui-workshop'
import React from 'react'
import {NavBanner} from '../NavBanner'

const TONE_OPTIONS = {
  Default: 'default',
  Primary: 'primary',
  Positive: 'positive',
  Caution: 'caution',
  Critical: 'critical',
} as const

export default function NavBannerStory() {
  const title = useString('Title', 'Network connection lost')
  const description = useText(
    'Description',
    'Your changes will not be saved. Please connect to a network to continue editing.'
  )
  const icon = useBoolean('Icon', true)
  const tone = useSelect('Tone', TONE_OPTIONS, 'caution')

  return (
    <NavBanner
      title={title}
      description={description}
      iconSymbol={icon ? 'warning-outline' : undefined}
      tone={tone}
    />
  )
}
