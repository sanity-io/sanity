export type ParseResult = {isValid: boolean; date?: Date; error?: string} & (
  | {isValid: true; date: Date}
  | {isValid: false; error?: string}
)

type TimeZoneInformation = {
  abbreviation: string
  alternativeName: string
  mainCities: string
  name: string
  namePretty: string
  offset: string
  value: string
}
