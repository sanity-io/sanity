import { SimpleHumanPreview } from "../components/views/SimpleHumanPreview";
import { JsonView } from "../components/views/JsonView";
import { DocumentIcon, EyeOpenIcon } from "@sanity/icons";
import S from "@sanity/desk-tool/structure-builder";
import {UsersIcon} from '@sanity/icons'

export default {
  name: "human",
  type: "document",
  title: "Human",
  views: [
    S.view
      .component(SimpleHumanPreview)
      .title("Simple preview")
      .icon(EyeOpenIcon),
    S.view.component(JsonView).title("JSON").icon(DocumentIcon),
  ],
  icon: UsersIcon,
  fields: [
    {
      name: "name",
      type: "string",
      title: "Name",
    },
    {
      name: "picture",
      title: "Picture",
      type: "image",
      options: {
        hotspot: true, // <-- Defaults to false
      },
      fields: [
        {
          name: "caption",
          type: "string",
          title: "Caption",
          options: {
            isHighlighted: true, // <-- make this field easily accessible
          },
        },
      ],
    },
    {
      title: "Pets",
      name: "pets",
      type: "array",
      of: [{ type: "reference", to: [{ type: "pet" }] }],
    },
    {
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }],
    },
  ],
  preview: {
    select: {
      name: "name",
      pets: "pets",
    },
    prepare(selection) {
      const { name, pets } = selection;
      const petsLength = pets?.length || 0
      const suffixPets = petsLength === 1 ? 'pet' : 'pets';
      const heartSuffix = petsLength > 0 ? '❤️' : '💔'
      return {
        title: name,
        subtitle:  `${`${petsLength || 0} ${suffixPets}`} ${heartSuffix}`,
      };
    },
  },
};
