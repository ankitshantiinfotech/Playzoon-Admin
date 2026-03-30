import { SimpleMasterDataPage } from "../shared/SimpleMasterDataPage";
import type { SimpleMasterDataPageConfig } from "../shared/SimpleMasterDataPage";
import { amenityMockData } from "./mockData";

const config: SimpleMasterDataPageConfig = {
  title: "Amenity Management",
  subtitle: "Manage facility amenities",
  breadcrumbLabel: "Amenity Management",
  entityName: "Amenity",
  nameField: {
    key: "name",
    label: "Amenity Name",
    placeholder: "e.g. Parking, WiFi, Cafeteria",
    required: true,
  },
  extraFields: [
    {
      key: "icon",
      label: "Icon",
      placeholder: "Enter an emoji or icon name (e.g. 🅿️, parking)",
      required: false,
      type: "text",
    },
  ],
  associationWarning:
    "This amenity is currently associated with one or more facilities.",
  idPrefix: "AMN",
};

export function AmenityMasterPage() {
  return <SimpleMasterDataPage config={config} initialData={amenityMockData} />;
}
