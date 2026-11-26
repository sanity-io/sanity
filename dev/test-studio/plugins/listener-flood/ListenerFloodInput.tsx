import {Stack, Text} from '@sanity/ui'
import {Suspense, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type StringInputProps, useDocumentStore} from 'sanity'

const LISTEN_QUERY_COUNT = 60
const LISTEN_QUERY_INDEXES = [...Array(LISTEN_QUERY_COUNT).keys()]

function ListenQueryItem(props: {index: number}) {
  const documentStore = useDocumentStore()
  const result$ = useMemo(
    () =>
      documentStore.listenQuery(
        '*[_type == "listenerFloodDocument" && title == $title][0]._id',
        {title: `listener-flood-${props.index}`},
        {tag: 'listener-flood-input'},
      ),
    [documentStore, props.index],
  )
  useObservable(result$, undefined)
  return null
}

export function ListenerFloodInput(props: StringInputProps) {
  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      <Text size={1} muted>
        {`This input holds ${LISTEN_QUERY_COUNT} listeners through documentStore.listenQuery`}
      </Text>
      <Suspense fallback={null}>
        {LISTEN_QUERY_INDEXES.map((index) => (
          <ListenQueryItem key={index} index={index} />
        ))}
      </Suspense>
    </Stack>
  )
}
