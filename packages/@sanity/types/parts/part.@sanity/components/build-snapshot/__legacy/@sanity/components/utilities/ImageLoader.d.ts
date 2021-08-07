import React from 'react'
import {Subscription} from 'rxjs'
interface ImageLoaderProps {
  src: string
  children: (props: {image: HTMLImageElement | null; error: Error | null}) => React.ReactNode
}
interface State {
  loadedImage: HTMLImageElement | null
  error: Error | null
}
export default class ImageLoader extends React.PureComponent<ImageLoaderProps, State> {
  state: {
    loadedImage: any
    error: any
  }
  subscription?: Subscription
  UNSAFE_componentWillMount(): void
  componentWillUnmount(): void
  unsubscribe(): void
  loadImage(src: string): void
  UNSAFE_componentWillReceiveProps(nextProps: ImageLoaderProps): void
  render(): {}
}
export {}
