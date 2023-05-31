import {Image} from '@sanity/types'

interface WelcomeVideo {
  link: Link
  videos: Video[]
}

interface Video {
  description: any //PTE
  image: Image
  title: string
  youtube: YouTube[]
}

interface Link {
  url: string
  title: string
}

interface YouTube {
  duration: number
  url: string
  videoId: string
}

interface Resource {
  sectionArray: SectionItem[]
  title: string
}

export interface SectionItem {
  sectionTitle: string
  items: Item[]
}

interface Item {
  _key: string
  _type: string
  title: string
  type?: string
  url?: string
}

export interface ResourcesResponse {
  resources: Resource
  welcome: WelcomeVideo
}
