import React from 'react'
import StudioRoot from 'part:@sanity/default-layout/root'
import {useCurrentUser} from '@sanity/base/hooks'
import GetStartedTutorial from './GetStartedTutorial'

export default function CustomDefaultLayout() {
  const {value} = useCurrentUser()

  const showTutorial = (value?.roles || []).length > 0

  return (
    <>
      {showTutorial && <GetStartedTutorial />}
      <StudioRoot />
    </>
  )
}
