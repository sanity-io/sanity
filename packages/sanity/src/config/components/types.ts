export interface MiddlewareProps<T> {
  renderDefault: (props: T) => React.ReactElement
}
