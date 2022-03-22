import type {Context, ErrorInfo, FocusEvent, ReactInstance, ReactNode} from 'react'

declare const _default: {
  new (props: import('./types').ButtonProps | Readonly<import('./types').ButtonProps>): {
    _element: HTMLButtonElement
    state: {
      focusSetFromOutside: boolean
    }
    focus(): void
    setRootElement: (el: HTMLButtonElement) => void
    handleBlur: (event: FocusEvent<HTMLButtonElement>) => void
    handleInnerBlur: () => void
    render(): JSX.Element
    context: any
    setState<K extends 'focusSetFromOutside'>(
      state:
        | import('./createButtonLike').ButtonState
        | ((
            prevState: Readonly<import('./createButtonLike').ButtonState>,
            props: Readonly<import('./types').ButtonProps>
          ) =>
            | import('./createButtonLike').ButtonState
            | Pick<import('./createButtonLike').ButtonState, K>)
        | Pick<import('./createButtonLike').ButtonState, K>,
      callback?: () => void
    ): void
    forceUpdate(callback?: () => void): void
    readonly props: Readonly<import('./types').ButtonProps> &
      Readonly<{
        children?: ReactNode
      }>
    refs: {
      [key: string]: ReactInstance
    }
    componentDidMount?(): void
    shouldComponentUpdate?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextState: Readonly<import('./createButtonLike').ButtonState>,
      nextContext: any
    ): boolean
    componentWillUnmount?(): void
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<import('./types').ButtonProps>,
      prevState: Readonly<import('./createButtonLike').ButtonState>
    ): any
    componentDidUpdate?(
      prevProps: Readonly<import('./types').ButtonProps>,
      prevState: Readonly<import('./createButtonLike').ButtonState>,
      snapshot?: any
    ): void
    componentWillMount?(): void
    UNSAFE_componentWillMount?(): void
    componentWillReceiveProps?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextContext: any
    ): void
    UNSAFE_componentWillReceiveProps?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextContext: any
    ): void
    componentWillUpdate?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextState: Readonly<import('./createButtonLike').ButtonState>,
      nextContext: any
    ): void
    UNSAFE_componentWillUpdate?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextState: Readonly<import('./createButtonLike').ButtonState>,
      nextContext: any
    ): void
  }
  new (props: import('./types').ButtonProps, context: any): {
    _element: HTMLButtonElement
    state: {
      focusSetFromOutside: boolean
    }
    focus(): void
    setRootElement: (el: HTMLButtonElement) => void
    handleBlur: (event: FocusEvent<HTMLButtonElement>) => void
    handleInnerBlur: () => void
    render(): JSX.Element
    context: any
    setState<K extends 'focusSetFromOutside'>(
      state:
        | import('./createButtonLike').ButtonState
        | ((
            prevState: Readonly<import('./createButtonLike').ButtonState>,
            props: Readonly<import('./types').ButtonProps>
          ) =>
            | import('./createButtonLike').ButtonState
            | Pick<import('./createButtonLike').ButtonState, K>)
        | Pick<import('./createButtonLike').ButtonState, K>,
      callback?: () => void
    ): void
    forceUpdate(callback?: () => void): void
    readonly props: Readonly<import('./types').ButtonProps> &
      Readonly<{
        children?: ReactNode
      }>
    refs: {
      [key: string]: ReactInstance
    }
    componentDidMount?(): void
    shouldComponentUpdate?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextState: Readonly<import('./createButtonLike').ButtonState>,
      nextContext: any
    ): boolean
    componentWillUnmount?(): void
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<import('./types').ButtonProps>,
      prevState: Readonly<import('./createButtonLike').ButtonState>
    ): any
    componentDidUpdate?(
      prevProps: Readonly<import('./types').ButtonProps>,
      prevState: Readonly<import('./createButtonLike').ButtonState>,
      snapshot?: any
    ): void
    componentWillMount?(): void
    UNSAFE_componentWillMount?(): void
    componentWillReceiveProps?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextContext: any
    ): void
    UNSAFE_componentWillReceiveProps?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextContext: any
    ): void
    componentWillUpdate?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextState: Readonly<import('./createButtonLike').ButtonState>,
      nextContext: any
    ): void
    UNSAFE_componentWillUpdate?(
      nextProps: Readonly<import('./types').ButtonProps>,
      nextState: Readonly<import('./createButtonLike').ButtonState>,
      nextContext: any
    ): void
  }
  displayName: string
  defaultProps: Record<string, unknown>
  contextType?: Context<any>
}
export default _default
