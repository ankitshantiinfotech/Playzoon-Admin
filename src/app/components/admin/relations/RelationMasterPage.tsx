import { SimpleMasterDataPage } from "../shared/SimpleMasterDataPage";
import type { SimpleMasterDataPageConfig } from "../shared/SimpleMasterDataPage";
import { relationMockData } from "./mockData";

const config: SimpleMasterDataPageConfig = {
  title: "Relation Management",
  subtitle: "Manage relations for player dependants",
  breadcrumbLabel: "Relation Management",
  entityName: "Relation",
  nameField: {
    key: "name",
    label: "Relation Name",
    placeholder: "e.g. Father, Mother, Guardian",
    required: true,
  },
  associationWarning:
    "This relation is already assigned to one or more player dependants.",
  idPrefix: "REL",
};

export function RelationMasterPage() {
  return <SimpleMasterDataPage config={config} initialData={relationMockData} />;
}
