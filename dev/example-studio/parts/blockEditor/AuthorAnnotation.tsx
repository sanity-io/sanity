import {useClient} from 'sanity'
import {SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import styles from './AuthorAnnotation.module.css'

export default function AuthorAnnotation(props: {_ref?: string; children?: React.ReactNode}) {
  const {_ref, children} = props
  const client = useClient()

  const [state, setState] = useState<{author: SanityDocument | null}>({
    author: null,
  })

  useEffect(() => {
    if (!_ref) return

    client.getDocument(_ref).then((author) => {
      setState({author: author || null})
    })
  }, [_ref, client])

  return (
    <Tooltip
      content={
        <Box>
          <Text>{String(state.author?.name)}</Text>
        </Box>
      }
      disabled={!state.author}
    >
      <span className={styles.root} data-tip="">
        {children}
      </span>
    </Tooltip>
  )
}
