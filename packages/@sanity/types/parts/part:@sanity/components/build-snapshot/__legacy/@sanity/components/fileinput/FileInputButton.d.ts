/// <reference types="react" />
declare const _default: {
  new (props: import('..').ButtonProps | Readonly<import('..').ButtonProps>): {
    _element: HTMLButtonElement
    state: {
      focusSetFromOutside: boolean
    }
    focus(): void
    setRootElement: (el: HTMLButtonElement) => void
    handleBlur: (event: import('react').FocusEvent<HTMLButtonElement>) => void
    handleInnerBlur: () => void
    render(): JSX.Element
    context: any
    setState<K extends 'focusSetFromOutside'>(
      state:
        | import('../buttons/createButtonLike').ButtonState
        | ((
            prevState: Readonly<import('../buttons/createButtonLike').ButtonState>,
            props: Readonly<import('..').ButtonProps>
          ) =>
            | import('../buttons/createButtonLike').ButtonState
            | Pick<import('../buttons/createButtonLike').ButtonState, K>)
        | Pick<import('../buttons/createButtonLike').ButtonState, K>,
      callback?: () => void
    ): void
    forceUpdate(callback?: () => void): void
    readonly props: Readonly<import('..').ButtonProps> &
      Readonly<{
        children?: import('react').ReactNode
      }>
    refs: {
      [key: string]: import('react').ReactInstance
    }
    componentDidMount?(): void
    shouldComponentUpdate?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      nextContext: any
    ): boolean
    componentWillUnmount?(): void
    componentDidCatch?(error: Error, errorInfo: import('react').ErrorInfo): void
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<import('..').ButtonProps>,
      prevState: Readonly<import('../buttons/createButtonLike').ButtonState>
    ): any
    componentDidUpdate?(
      prevProps: Readonly<import('..').ButtonProps>,
      prevState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      snapshot?: any
    ): void
    componentWillMount?(): void
    UNSAFE_componentWillMount?(): void
    componentWillReceiveProps?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextContext: any
    ): void
    UNSAFE_componentWillReceiveProps?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextContext: any
    ): void
    componentWillUpdate?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      nextContext: any
    ): void
    UNSAFE_componentWillUpdate?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      nextContext: any
    ): void
  }
  new (props: import('..').ButtonProps, context: any): {
    _element: HTMLButtonElement
    state: {
      focusSetFromOutside: boolean
    }
    focus(): void
    setRootElement: (el: HTMLButtonElement) => void
    handleBlur: (event: import('react').FocusEvent<HTMLButtonElement>) => void
    handleInnerBlur: () => void
    render(): JSX.Element
    context: any
    setState<K extends 'focusSetFromOutside'>(
      state:
        | import('../buttons/createButtonLike').ButtonState
        | ((
            prevState: Readonly<import('../buttons/createButtonLike').ButtonState>,
            props: Readonly<import('..').ButtonProps>
          ) =>
            | import('../buttons/createButtonLike').ButtonState
            | Pick<import('../buttons/createButtonLike').ButtonState, K>)
        | Pick<import('../buttons/createButtonLike').ButtonState, K>,
      callback?: () => void
    ): void
    forceUpdate(callback?: () => void): void
    readonly props: Readonly<import('..').ButtonProps> &
      Readonly<{
        children?: import('react').ReactNode
      }>
    refs: {
      [key: string]: import('react').ReactInstance
    }
    componentDidMount?(): void
    shouldComponentUpdate?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      nextContext: any
    ): boolean
    componentWillUnmount?(): void
    componentDidCatch?(error: Error, errorInfo: import('react').ErrorInfo): void
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<import('..').ButtonProps>,
      prevState: Readonly<import('../buttons/createButtonLike').ButtonState>
    ): any
    componentDidUpdate?(
      prevProps: Readonly<import('..').ButtonProps>,
      prevState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      snapshot?: any
    ): void
    componentWillMount?(): void
    UNSAFE_componentWillMount?(): void
    componentWillReceiveProps?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextContext: any
    ): void
    UNSAFE_componentWillReceiveProps?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextContext: any
    ): void
    componentWillUpdate?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      nextContext: any
    ): void
    UNSAFE_componentWillUpdate?(
      nextProps: Readonly<import('..').ButtonProps>,
      nextState: Readonly<import('../buttons/createButtonLike').ButtonState>,
      nextContext: any
    ): void
  }
  displayName: string
  defaultProps: Record<string, unknown>
  contextType?: import('react').Context<any>
}
export default _default
