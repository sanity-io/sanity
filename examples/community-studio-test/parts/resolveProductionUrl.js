// @TODO: update to live URL once community is merged to master
const getPreviewUrl = ({type, slug}) =>
  `https://www.sanity.io/api/preview?type=${type}&slug=${slug}`;

export default function resolveProductionUrl(document) {
  if (!document?._type) {
    return
  }
  if (document._type === 'contribution.starter') {
    if (document.repoId) {
      return `https://create.sanity.io/?template=${document.repoId}`;
    }
    return;
  }
  if (document._type === 'person') {
    if (document.handle?.current) {
      return getPreviewUrl({type: 'person', slug: document.handle.current});
    }
    return;
  }
  if (document._type.startsWith("contribution.")) {
    if (document.slug?.current) {
      return getPreviewUrl({type: document._type, slug: document.slug.current});
    }
    return;
  }
}
