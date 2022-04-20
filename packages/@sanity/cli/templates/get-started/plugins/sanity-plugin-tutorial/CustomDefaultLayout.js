import React from 'react'
import StudioRoot from 'part:@sanity/default-layout/root'
import {useCurrentUser} from '@sanity/base/hooks'
import HelloSanityTutorial from './HelloSanityTutorial'
import styled from 'styled-components'

// Hide the empty schema message
const Wrapper = styled.div`
  height: 100%;

  *[data-testid='missing-document-types-message'] {
    display: none;
  }
`

export default function CustomDefaultLayout() {
  const currentUser = useCurrentUser()

  return (
    <Wrapper>
      {currentUser.value && <HelloSanityTutorial />}
      <StudioRoot />
    </Wrapper>
  )
}
