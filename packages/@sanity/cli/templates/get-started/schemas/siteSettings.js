import { CogIcon } from "@sanity/icons";

export default {
  name: "ss",
  icon: CogIcon,
  title: "Site Settings",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Site Title",
      type: "string",
    },
    {
      name: "description",
      title: "Site Description",
      type: "text",
    },
  ],
};
