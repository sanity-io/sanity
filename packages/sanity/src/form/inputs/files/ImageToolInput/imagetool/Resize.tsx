import React from 'react'

export interface ResizeProps {
  image: HTMLImageElement
  maxHeight: number
  maxWidth: number
  children: (canvas: HTMLCanvasElement) => React.ReactNode
}

export class Resize extends React.Component<ResizeProps> {
  _canvas: HTMLCanvasElement | null = null

  componentWillUnmount() {
    if (this._canvas) {
      document.body.removeChild(this._canvas)
    }
  }

  getCanvas() {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas')
      document.body.appendChild(this._canvas)
      this._canvas.style.display = 'none'
    }
    return this._canvas
  }

  resize(image: HTMLImageElement, maxHeight: number, maxWidth: number) {
    const canvas = this.getCanvas()
    const ratio = image.width / image.height
    const width = Math.min(image.width, maxWidth)
    const height = Math.min(image.height, maxHeight)

    const landscape = image.width > image.height
    const targetWidth = landscape ? width : height * ratio
    const targetHeight = landscape ? width / ratio : height

    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, targetWidth, targetHeight)
    }

    return canvas
  }

  render() {
    const {image, maxHeight, maxWidth, children} = this.props
    return children(this.resize(image, maxHeight, maxWidth))
  }
}
