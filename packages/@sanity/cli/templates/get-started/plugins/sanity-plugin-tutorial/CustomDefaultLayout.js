import React from 'react'
import StudioRoot from 'part:@sanity/default-layout/root'
import {useCurrentUser} from '@sanity/base/hooks'
import GetStartedTutorial from './GetStartedTutorial'

export default function CustomDefaultLayout() {
  const currentUser = useCurrentUser()

  return (
    <>
      {currentUser.value && <GetStartedTutorial />}
      <StudioRoot />
    </>
  )
}
