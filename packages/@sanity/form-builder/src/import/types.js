type PreviewProps = {
  title: string,
  imageUrl: string,
}

type EventType = 'process' | 'complete'

export type ImportEvent<T> = {
  type: EventType,
  percent: number,
  preview: PreviewProps,
  result: ?T
}
