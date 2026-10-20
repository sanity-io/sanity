// FIXTURE. The dataset has no dimension config: a dimension's values are derived from the variant definitions, so a value
// nobody authored cannot exist in the data (deriveDimensions in ../c1/model.ts). The Dimension lens at the GA stage shows
// such values as an empty column, "no definition yet". This list stands in for the server-side dimension config that the
// lens needs; it is a design fixture, not data. Remove it when the platform stores declared values.
export const DECLARED_VALUES: Record<string, readonly (readonly [string, string])[]> = {
  audience: [
    ['students', 'Students'],
    ['partners', 'Partners'],
  ],
  locale: [
    ['fr-FR', 'French (France)'],
    ['ja-JP', 'Japanese'],
  ],
  plan: [['enterprise-trial', 'Enterprise trial']],
}
