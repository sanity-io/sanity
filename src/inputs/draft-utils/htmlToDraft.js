import DraftPasteProcessor from 'draft-js/lib/DraftPasteProcessor';

let { processHTML } = DraftPasteProcessor;

export default function(html) {
  return processHTML(html);
}