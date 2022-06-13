import { JsonView } from "../components/views/JsonView";
import {
  DocumentIcon,
  EyeOpenIcon,
  HeartFilledIcon,
  StarIcon,
} from "@sanity/icons";
import S from "@sanity/desk-tool/structure-builder";
import { SimpleDogPreview } from "../components/views/SimpleDogPreview";
import { RangeInput } from "../components/inputs/RangeInput";
import { CharacterCount } from "../components/inputs/CharacterCount";

export default {
  name: "pet",
  type: "document",
  title: "Pet",
  icon: HeartFilledIcon,

  views: [
    S.view
      .component(SimpleDogPreview)
      .title("Simple preview")
      .icon(EyeOpenIcon),
    S.view.component(JsonView).title("JSON").icon(DocumentIcon),
  ],

  groups: [
    {
      name: "favourites",
      title: "Favourites",
      icon: StarIcon,
    },
  ],

  fields: [
    {
      name: "name",
      type: "string",
      title: "Name",
      inputComponent: CharacterCount,
      validation: (Rule) => Rule.max(100),
    },
    {
      name: "birthday",
      type: "date",
      title: "Date of birth",
    },
    {
      name: "weight",
      type: "number",
      title: "Weight (kg)",
      inputComponent: RangeInput,
      options: {
        range: {
          min: 0,
          max: 50,
          step: 0.1,
        },
      },
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
        {
          name: "alt",
          type: "string",
          title: "Alt text",
          options: {
            isHighlighted: true, // <-- make this field easily accessible
          },
        },
      ],
    },
    {
      name: "human",
      type: "reference",
      title: "Human",
      to: [{ type: "human" }],
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    },
    {
      name: "toys",
      title: "Favourite toys",
      description:
        "Ordered list where the first item will be the first position",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      group: "favourites",
    },
    {
      name: "treats",
      title: "Favourite treats",
      description:
        "Ordered list where the first item will be the first position",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      group: "favourites",
    },
  ],
};
