export interface Probe {
  path: (string | number)[]
  containerType(): 'object' | 'array' | 'primitive'
  length(): number
  getIndex(index: number): Probe | false | null
  get: () => unknown
  getAttribute(attr: string): Probe | null
  attributeKeys(): string[]
  hasAttribute(attr: string): boolean
}
