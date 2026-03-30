import { SimpleMasterDataPage } from "../shared/SimpleMasterDataPage";
import type { SimpleMasterDataPageConfig } from "../shared/SimpleMasterDataPage";
import { enquiryCategoryMockData } from "./mockData";

const config: SimpleMasterDataPageConfig = {
  title: "Enquiry Category Management",
  subtitle: "Manage Contact Us enquiry categories",
  breadcrumbLabel: "Enquiry Category Management",
  entityName: "Enquiry Category",
  nameField: {
    key: "name",
    label: "Category Name",
    placeholder: "e.g. General Inquiry, Booking Issue",
    required: true,
  },
  associationWarning:
    "This category is currently associated with one or more enquiries.",
  idPrefix: "ENQ",
};

export function EnquiryCategoryMasterPage() {
  return (
    <SimpleMasterDataPage
      config={config}
      initialData={enquiryCategoryMockData}
    />
  );
}
