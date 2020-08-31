import {ArrayDiff, ObjectDiff} from '@sanity/field/diff'
import {ReactElement} from 'react'

export type PortableTextBlock = {
  _key: string
  _type: string
  children: PortableTextChild[]
  style?: string
}

export type PortableTextChild = {
  _key: string
  _type: string
  marks?: string[]
  text?: string
}

export type ChildMap = Record<
  string,
  {
    annotation: React.ReactNode | undefined
    child: PortableTextChild
    diffs: ObjectDiff[] | ArrayDiff[]
    summary: React.ReactNode[]
  }
>
