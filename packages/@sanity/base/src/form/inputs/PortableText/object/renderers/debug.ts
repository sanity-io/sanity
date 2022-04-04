export const debugElement =
  process.env.NODE_ENV === 'production'
    ? null
    : {
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
