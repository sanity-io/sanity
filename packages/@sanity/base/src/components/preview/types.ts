export type PreviewNode<T> = React.ReactNode | React.FC<T>

export interface PreviewMediaDimensions {
  width?: number
  height?: number
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
  aspect?: number
}
