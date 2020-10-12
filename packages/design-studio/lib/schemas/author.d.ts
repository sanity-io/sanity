declare const _default: {
  type: string
  name: string
  title: string
  icon: any
  fields: (
    | {
        type: string
        name: string
        title: string
        validation: (Rule: any) => any
        options?: undefined
        fields?: undefined
        of?: undefined
      }
    | {
        type: string
        name: string
        title: string
        options: {
          layout: string
          list: string[]
          direction: string
          hotspot?: undefined
        }
        validation?: undefined
        fields?: undefined
        of?: undefined
      }
    | {
        type: string
        name: string
        title: string
        options: {
          hotspot: boolean
          layout?: undefined
          list?: undefined
          direction?: undefined
        }
        fields: (
          | {
              name: string
              type: string
              title: string
              options: {
                isHighlighted: boolean
              }
            }
          | {
              name: string
              type: string
              title: string
              options?: undefined
            }
        )[]
        validation?: undefined
        of?: undefined
      }
    | {
        type: string
        name: string
        title: string
        of: {
          type: string
        }[]
        validation?: undefined
        options?: undefined
        fields?: undefined
      }
    | {
        type: string
        name: string
        title: string
        validation?: undefined
        options?: undefined
        fields?: undefined
        of?: undefined
      }
  )[]
}
export default _default
