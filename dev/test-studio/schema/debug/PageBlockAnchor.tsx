import {LinkIcon} from '@sanity/icons'
import {Box, Button, Flex, useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {type ObjectItemProps, type Slug, useFormValue} from 'sanity'

export function PageBlockAnchor(props: ObjectItemProps) {
  const slug = useFormValue(['slug']) as Slug | undefined
  const toast = useToast()

  const hash = `#${props.value._key}`

  const handleCopy = useCallback(async () => {
    if (!slug?.current) {
      return toast.push({
        status: 'error',
        title: 'Cannot copy anchor to block due to missing slug',
      })
    }

    const host = `${window.location.origin}/`
    const url = host + slug.current + hash

    await navigator.clipboard.writeText(url)

    toast.push({
      status: 'success',
      title: 'Copied direct page block anchor to clipboard!',
      description: url,
    })

    return url
  }, [hash, slug, toast])

  return (
    <Flex gap={3} paddingRight={2} align="center">
      <Box flex={1}>{props.renderDefault(props)}</Box>
      <Button mode="bleed" icon={LinkIcon} onClick={handleCopy} title="Copy anchor link" />
    </Flex>
  )
}
