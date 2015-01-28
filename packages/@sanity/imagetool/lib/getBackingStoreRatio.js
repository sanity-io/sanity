var prefixes = ['','webkit','moz','ms','o'];
var foundPrefix = null;

export default function getBackingStoreRatio(context) {
  if (foundPrefix === null) {
    foundPrefix = prefixes.find(testPrefix => testPrefix+'backingStoreRatio' in context);
  }
  return context[foundPrefix+'backingStoreRatio'];
}