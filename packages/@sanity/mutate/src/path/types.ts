export type KeyedPathElement = {_key: string}

export type PropertyName = string
export type Index = number
export type PathElement = PropertyName | Index | KeyedPathElement
export type Path = PathElement[] | readonly PathElement[]
