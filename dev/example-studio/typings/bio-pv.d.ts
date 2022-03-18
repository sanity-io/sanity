declare module 'bio-pv' {
  export declare class Viewer {
    public _cam: {_rotation: number[]; _center: number[]; _zoom: number}
    public _redrawRequested: boolean
    constructor(element: HTMLElement, options?: Record<string, unknown>)
    public clear: () => void
    public destroy: () => void
    public cartoon: (key: string, value: unknown, options: Record<string, unknown>) => void
    public spheres: (key: string, value: unknown, options: {boundingSpheres?: boolean}) => void
    public autoZoom: () => void
    public setCamera: (rotation: number[], center: number[], zoom: number) => void
  }

  export const io: {
    fetchPdb: (
      url: string,
      callback: (result: {select: (params: {rnames?: string[]}) => unknown}) => void
    ) => void
  }
}
