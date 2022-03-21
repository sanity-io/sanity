// deskStructure.js
import S from "@sanity/desk-tool/structure-builder";
import { CogIcon } from "@sanity/icons";

export default () =>
  S.list()
    .title("Base")
    .items([
      S.listItem()
        .title("Site Settings")
        .icon(CogIcon)
        .child(S.document().schemaType("ss").documentId("siteSettings")),
    ]);
