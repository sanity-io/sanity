declare const getOffsetsTo: (
  source: HTMLElement,
  target: HTMLElement
) => {
  rect: {
    top: number
    left: number
    height: number
    width: number
  }
  bounds: {
    top: number
    height: number
    left: number
    width: number
  }
}
export default getOffsetsTo
