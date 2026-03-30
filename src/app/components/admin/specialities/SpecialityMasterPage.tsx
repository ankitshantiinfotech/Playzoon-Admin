import { SimpleMasterDataPage } from "../shared/SimpleMasterDataPage";
import type { SimpleMasterDataPageConfig } from "../shared/SimpleMasterDataPage";
import { specialityMockData } from "./mockData";

const config: SimpleMasterDataPageConfig = {
  title: "Speciality Management",
  subtitle: "Manage coach specialities",
  breadcrumbLabel: "Speciality Management",
  entityName: "Speciality",
  nameField: {
    key: "name",
    label: "Speciality Name",
    placeholder: "e.g. Fitness Training, Goalkeeping",
    required: true,
  },
  associationWarning:
    "This speciality is currently associated with one or more coaches.",
  idPrefix: "SPC",
};

export function SpecialityMasterPage() {
  return (
    <SimpleMasterDataPage config={config} initialData={specialityMockData} />
  );
}
