export type Type = {
  type: Type
  name: string
  title: string
  options: Record<string, any> | null
  [prop: string]: any
}
