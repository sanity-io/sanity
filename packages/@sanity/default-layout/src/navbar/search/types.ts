export interface ResultItem {
  hit: {_id: string; _type: string}
  score: number
  stories: {path: string; score: number; why: string}[]
}
