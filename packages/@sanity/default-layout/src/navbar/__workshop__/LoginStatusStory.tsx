import {CurrentUser} from '@sanity/types'
import {Flex} from '@sanity/ui'
import {useSelect, useText} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {LoginStatus} from '../loginStatus'

const PROVIDER_OPTIONS: Record<string, 'github' | 'google' | 'saml-test' | 'sanity' | ''> = {
  Empty: '',
  Github: 'github',
  Google: 'google',
  SAML: 'saml-test',
  Sanity: 'sanity',
}

const noop = () => null

export default function LoginStatusStory() {
  const provider = useSelect('Provider', PROVIDER_OPTIONS, 'sanity')
  const name = useText('Name', 'Some Name')
  const email = useText('Email', 'somename@sanity.io')

  const currentUser: CurrentUser = useMemo(
    () => ({
      id: 'id',
      name: name,
      email: email,
      profileImage: 'https://source.unsplash.com/96x96/?face',
      provider: provider,
      role: '',
      roles: [],
    }),
    [provider, name, email]
  )

  return (
    <Flex align="center" height="fill" justify="center">
      <LoginStatus onLogout={noop} currentUser={currentUser} projectId="1234" />
    </Flex>
  )
}
