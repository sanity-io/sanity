declare const __DEV__: boolean

export const debugElement = __DEV__
  ? {
      getBoundingClientRect: () => {
        const x = 200
        const y = 200

        return {
          left: x,
          top: y,
          right: x,
          bottom: y,
          width: 0,
          height: 0,
        }
      },
    }
  : null
