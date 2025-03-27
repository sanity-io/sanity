/* eslint-disable i18next/no-literal-string */
import {LaunchIcon} from '@sanity/icons'
import {Card, Stack, Text, TextInput} from '@sanity/ui'
import {useEffect, useMemo} from 'react'
import {styled} from 'styled-components'

import {Dialog} from '../../../ui-components'

interface CorsOriginErrorScreenProps {
  projectId?: string
  isStaging: boolean
}

export const ScreenReaderLabel = styled.label`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  overflow: clip;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

export function CorsOriginErrorScreen(props: CorsOriginErrorScreenProps) {
  const {projectId, isStaging} = props

  const origin = window.location.origin
  const corsUrl = useMemo(() => {
    const url = new URL(
      `/manage/project/${projectId}/api`,
      isStaging ? 'https://sanity.work' : 'https://sanity.io',
    )
    url.searchParams.set('cors', 'add')
    url.searchParams.set('origin', origin)
    url.searchParams.set('credentials', '')

    return url.toString()
  }, [isStaging, origin, projectId])

  useEffect(() => {
    const handleFocus = () => {
      window.location.reload()
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (
    <Card height="fill">
      <Dialog
        id="cors-error-dialog"
        header="Before you continue..."
        width={1}
        footer={{
          confirmButton: {
            text: 'Continue',
            iconRight: LaunchIcon,
            as: 'a',
            href: corsUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            tone: 'primary',
          },
        }}
      >
        <Stack gap={4}>
          <Text>
            To access your content, you need to <b>add the following URL as a CORS origin</b> to
            your Sanity project.
          </Text>

          {/* added for accessibility */}
          <ScreenReaderLabel aria-hidden="true">CORS URL to be added</ScreenReaderLabel>
          <TextInput value={origin} readOnly />
        </Stack>
      </Dialog>
    </Card>
  )
}
