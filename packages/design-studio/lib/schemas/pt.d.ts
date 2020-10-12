declare const _default: {
  type: string
  name: string
  title: string
  fields: (
    | {
        type: string
        name: string
        title: string
        of: (
          | {
              type: string
              name: string
              title: string
              fields: (
                | {
                    type: string
                    name: string
                    title: string
                    to?: undefined
                  }
                | {
                    type: string
                    name: string
                    to: {
                      type: string
                    }
                    title?: undefined
                  }
              )[]
            }
          | {
              type: string
              name: string
              title: string
              options: {
                hotspot: boolean
              }
            }
          | {
              type: string
              of: {
                validation: (Rule: any) => any
                type: string
                name: string
                title: string
                fields: (
                  | {
                      type: string
                      name: string
                      title: string
                      to?: undefined
                    }
                  | {
                      type: string
                      name: string
                      to: {
                        type: string
                      }
                      title?: undefined
                    }
                )[]
              }[]
              marks: {
                annotations: (
                  | {
                      type: string
                      name: string
                      title: string
                      fields: (
                        | {
                            type: string
                            name: string
                            title: string
                            to?: undefined
                          }
                        | {
                            type: string
                            name: string
                            to: {
                              type: string
                            }
                            title?: undefined
                          }
                      )[]
                    }
                  | {
                      type: string
                      name: string
                      fields: (
                        | {
                            type: string
                            name: string
                            title: string
                            validation: (Rule: any) => any
                            options?: undefined
                          }
                        | {
                            type: string
                            name: string
                            title: string
                            options: {
                              list: {
                                value: string
                                title: string
                              }[]
                            }
                            validation?: undefined
                          }
                      )[]
                    }
                )[]
              }
            }
        )[]
      }
    | {
        type: string
        name: string
        title: string
        of: {
          type: string
          name: string
          title: string
          fields: (
            | {
                type: string
                name: string
                title: string
                of: (
                  | {
                      type: string
                      name: string
                      title: string
                      fields: (
                        | {
                            type: string
                            name: string
                            title: string
                            to?: undefined
                          }
                        | {
                            type: string
                            name: string
                            to: {
                              type: string
                            }
                            title?: undefined
                          }
                      )[]
                    }
                  | {
                      type: string
                      name: string
                      title: string
                      options: {
                        hotspot: boolean
                      }
                    }
                  | {
                      type: string
                      of: {
                        validation: (Rule: any) => any
                        type: string
                        name: string
                        title: string
                        fields: (
                          | {
                              type: string
                              name: string
                              title: string
                              to?: undefined
                            }
                          | {
                              type: string
                              name: string
                              to: {
                                type: string
                              }
                              title?: undefined
                            }
                        )[]
                      }[]
                      marks: {
                        annotations: (
                          | {
                              type: string
                              name: string
                              title: string
                              fields: (
                                | {
                                    type: string
                                    name: string
                                    title: string
                                    to?: undefined
                                  }
                                | {
                                    type: string
                                    name: string
                                    to: {
                                      type: string
                                    }
                                    title?: undefined
                                  }
                              )[]
                            }
                          | {
                              type: string
                              name: string
                              fields: (
                                | {
                                    type: string
                                    name: string
                                    title: string
                                    validation: (Rule: any) => any
                                    options?: undefined
                                  }
                                | {
                                    type: string
                                    name: string
                                    title: string
                                    options: {
                                      list: {
                                        value: string
                                        title: string
                                      }[]
                                    }
                                    validation?: undefined
                                  }
                              )[]
                            }
                        )[]
                      }
                    }
                )[]
              }
            | {
                type: string
                name: string
                title: string
              }
          )[]
        }[]
        options: {}
      }
    | {
        type: string
        name: string
        title: string
      }
  )[]
}
export default _default
