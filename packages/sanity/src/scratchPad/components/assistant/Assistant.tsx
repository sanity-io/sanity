import {Box, Card, TextArea} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {keyGenerator} from '@sanity/portable-text-editor'
import {useScratchPad} from '../../hooks/useScratchPad'
import {fragmentToAssistantText} from '../../utils/toAssistantText'

export interface AssistantResponse {
  key: string
  response: string
  fragment: {
    text: string | undefined
    portableText: PortableTextBlock[] | undefined
  } | null
}

const DESCRIPTIONS = [
  'swell',
  'not that good to be honest',
  'marvelous',
  'really hitting the nail',
  'something else',
  'excellent',
  'just right',
  'brave',
  'boring',
  'explaining this too complicated',
  'too full of buzzwords',
]

const FIRST_RESPONSE: AssistantResponse = {
  key: 'first',
  response: "Hey, I'm a AI assistant and here to help you with your content.",
  fragment: null,
}

export function ScratchPadAssistant() {
  const {assistanceFragment, assistantPromptRef} = useScratchPad()
  const [assistantResponses, setAssistantResponses] = useState<AssistantResponse[]>([
    FIRST_RESPONSE,
  ])

  useEffect(() => {
    const text = fragmentToAssistantText(assistanceFragment)
    if (text) {
      setAssistantResponses((prevState) => [
        ...prevState,
        {
          key: keyGenerator(),
          response: `Your text "${text}" is ${
            DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)]
          }.`,
          fragment: {portableText: assistanceFragment, text},
        },
      ])
    }
  }, [assistanceFragment])

  return (
    <>
      <Card marginTop={4}>
        <Box>
          <ul>
            {assistantResponses.map((item) => (
              <li key={`response-${item.key}`}>
                <Box>{item.response}</Box>
              </li>
            ))}
          </ul>
        </Box>
      </Card>
      <Card marginTop={4}>
        <TextArea placeholder="Ask or instruct the assistant" ref={assistantPromptRef} />
      </Card>
    </>
  )
}
