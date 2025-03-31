import {defineType} from 'sanity'

export default defineType({
  type: 'document',
  name: 'internationalizedArrayTest',
  title: 'Internationalized Array Test',
  fields: [
    {
      type: 'internationalizedArrayString',
      name: 'title',
      title: 'Title',
    },
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      return {
        title: selection.title?.find(({_key}: any) => _key === 'en')?.value || 'Untitled',
        subtitle: selection.title?.some(({_key, value}: any) => _key !== 'en' && value?.trim())
          ? formatLanguages(
              selection.title
                ?.filter(({_key, value}: any) => _key !== 'en' && value?.trim())
                .map(({_key}: any) => _key),
            )
          : undefined,
      }
    },
  },
})

function formatLanguages(langs: string[]) {
  const displayNames = new Intl.DisplayNames(['en'], {type: 'language'})
  const formattedLangs = langs.map((lang) => displayNames.of(lang))

  return `${
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    new Intl.ListFormat('en', {style: 'short', type: 'conjunction'}).format(formattedLangs)
  } available`
}
