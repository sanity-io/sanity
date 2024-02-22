import {SpinnerIcon, TrashIcon} from '@sanity/icons'
import {Flex, TextInput, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'
import {useClient, useThrottledCallback} from 'sanity'
import styled, {keyframes} from 'styled-components'

import {Button} from '../../../../../ui-components'
import {type TaskTarget} from '../../types'
import {DocumentPreview} from '../list/DocumentPreview'

interface TargetInputProps {
  onChange: (document: {documentId: string; documentType: string} | null) => void
  value?: TaskTarget
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

// This is a WIP implementation, we will later use the Form to handle the creation of a task and we will have access to the ReferenceInput
export function TargetInput(props: TargetInputProps) {
  const {onChange, value} = props
  const client = useClient()
  const toast = useToast()
  const handleRemoveTarget = useCallback(() => onChange(null), [onChange])
  const [loading, setLoading] = useState(false)

  const onReferenceChange = useCallback(
    async (event: FormEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      if (!inputValue) {
        onChange(null)
        return
      }
      try {
        setLoading(true)
        const doc = await client.fetch('*[_id in [$id, "drafts." + $id]][0]', {id: inputValue})
        if (!doc) {
          toast.push({
            closable: true,
            status: 'error',
            title: 'Document not found',
          })
          return
        }

        onChange({
          documentType: doc._type,
          documentId: doc._id,
        })
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: 'Error fetching document',
        })
      } finally {
        setLoading(false)
      }
    },
    [client, onChange, toast],
  )

  const throttledOnReferenceChange = useThrottledCallback(onReferenceChange, 300, {leading: true})

  if (value) {
    return (
      <Flex align={'center'} justify={'space-between'}>
        <DocumentPreview documentId={value.document._ref} documentType={value.documentType} />
        <Button
          mode="bleed"
          tone="critical"
          onClick={handleRemoveTarget}
          icon={TrashIcon}
          tooltipProps={{
            content: 'Remove document',
          }}
        />
      </Flex>
    )
  }
  return (
    <TextInput
      onChange={throttledOnReferenceChange}
      placeholder="Document id"
      fontSize={1}
      iconRight={loading && AnimatedSpinnerIcon}
    />
  )
}
