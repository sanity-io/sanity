import React, {useEffect} from 'react'
import {render, act} from '@testing-library/react'
import {createConfig} from '../../config'
import {StudioProvider} from '../StudioProvider'
import {useWorkspace} from '../workspace'

describe('StudioProvider', () => {
  it('works', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // intentionally blank
    })

    const projectId = 'ppsg7ml5'

    window.localStorage.setItem(
      `__studio_auth_token_${projectId}`,
      JSON.stringify({
        token: 'skaQT9YgcOZEKweP9PCUzQH3SoEYBGjudmJp4MwTBw8TlTIGPVWtDWDLKbJRxCCHcFrt5s4sTxZHcQCh',
      })
    )

    const config = createConfig({
      name: 'default',
      projectId,
      dataset: 'test',
    })

    function Content() {
      const workspace = useWorkspace()

      useEffect(() => {
        // console.log({workspace})
      }, [workspace])

      return <>content!</>
    }

    const {debug} = render(
      <StudioProvider config={config}>
        <Content />
      </StudioProvider>
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    })

    debug()

    consoleErrorSpy.mockRestore()
  })
})
