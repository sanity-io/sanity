/* eslint-disable @typescript-eslint/no-shadow */
import {useEffect, useState, type ReactElement} from 'react'

interface ImageLoaderProps {
  src: string
  children: (props: {
    isLoading: boolean
    image: HTMLImageElement | null
    error: Error | null
  }) => ReactElement | null
}

export function ImageLoader(props: ImageLoaderProps) {
  const {src, children} = props
  const [isLoading, setIsLoading] = useState(true)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setImage(null)
    setError(null)
    setIsLoading(true)

    const image = new Image()

    image.onload = () => {
      setImage(image)
      setError(null)
      setIsLoading(false)
    }

    image.onerror = () => {
      setError(new Error(`Could not load image from ${JSON.stringify(src)}`))
      setIsLoading(false)
    }

    image.referrerPolicy = 'strict-origin-when-cross-origin'
    image.src = src
  }, [src])

  return children({image, error, isLoading})
}
