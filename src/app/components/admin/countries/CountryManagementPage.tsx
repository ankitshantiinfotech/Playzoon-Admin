// ─── SCR-ADM-044: Location Master Data ──────────────────────────────────────
// Two-panel layout: left = country list (320px), right = cities for selected country.
// CRUD modals for countries and cities. EN/AR dual-language fields.
// Hierarchy: Country -> Cities. Cities cannot exist without a parent country.

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Globe,
  MapPin,
  Download,
  ArrowUpDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import type { Country, City } from "./types";

// ─── Mock Data (seeded per Section 14 of spec) ─────────────────────────────

const INITIAL_COUNTRIES: Country[] = [
  {
    id: "c1",
    nameEn: "Saudi Arabia",
    nameAr: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629",
    code: "SA",
    isActive: true,
    createdAt: "2024-01-01",
    cities: [
      { id: "ci1", countryId: "c1", nameEn: "Riyadh", nameAr: "\u0627\u0644\u0631\u064a\u0627\u0636", code: "RUH", isActive: true, facilitiesCount: 24, addressesCount: 180, createdAt: "2024-01-01" },
      { id: "ci2", countryId: "c1", nameEn: "Jeddah", nameAr: "\u062c\u062f\u0629", code: "JED", isActive: true, facilitiesCount: 18, addressesCount: 120, createdAt: "2024-01-01" },
      { id: "ci3", countryId: "c1", nameEn: "Dammam", nameAr: "\u0627\u0644\u062f\u0645\u0627\u0645", code: "DMM", isActive: true, facilitiesCount: 8, addressesCount: 45, createdAt: "2024-01-01" },
      { id: "ci4", countryId: "c1", nameEn: "Mecca", nameAr: "\u0645\u0643\u0629 \u0627\u0644\u0645\u0643\u0631\u0645\u0629", code: "MEC", isActive: true, facilitiesCount: 5, addressesCount: 32, createdAt: "2024-01-01" },
      { id: "ci5", countryId: "c1", nameEn: "Medina", nameAr: "\u0627\u0644\u0645\u062f\u064a\u0646\u0629 \u0627\u0644\u0645\u0646\u0648\u0631\u0629", code: "MED", isActive: true, facilitiesCount: 4, addressesCount: 28, createdAt: "2024-01-01" },
      { id: "ci6", countryId: "c1", nameEn: "Khobar", nameAr: "\u0627\u0644\u062e\u0628\u0631", code: "KHO", isActive: true, facilitiesCount: 6, addressesCount: 22, createdAt: "2024-01-01" },
      { id: "ci7", countryId: "c1", nameEn: "Tabuk", nameAr: "\u062a\u0628\u0648\u0643", code: "TBK", isActive: false, facilitiesCount: 0, addressesCount: 0, createdAt: "2024-06-15" },
      { id: "ci8", countryId: "c1", nameEn: "Abha", nameAr: "\u0623\u0628\u0647\u0627", code: "ABH", isActive: true, facilitiesCount: 2, addressesCount: 10, createdAt: "2024-03-01" },
    ],
  },
  {
    id: "c2",
    nameEn: "United Arab Emirates",
    nameAr: "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629",
    code: "AE",
    isActive: true,
    createdAt: "2024-01-01",
    cities: [
      { id: "ci9", countryId: "c2", nameEn: "Dubai", nameAr: "\u062f\u0628\u064a", code: "DXB", isActive: true, facilitiesCount: 30, addressesCount: 200, createdAt: "2024-01-01" },
      { id: "ci10", countryId: "c2", nameEn: "Abu Dhabi", nameAr: "\u0623\u0628\u0648 \u0638\u0628\u064a", code: "AUH", isActive: true, facilitiesCount: 15, addressesCount: 90, createdAt: "2024-01-01" },
      { id: "ci11", countryId: "c2", nameEn: "Sharjah", nameAr: "\u0627\u0644\u0634\u0627\u0631\u0642\u0629", code: "SHJ", isActive: true, facilitiesCount: 7, addressesCount: 35, createdAt: "2024-01-01" },
    ],
  },
  {
    id: "c3",
    nameEn: "Bahrain",
    nameAr: "\u0627\u0644\u0628\u062d\u0631\u064a\u0646",
    code: "BH",
    isActive: true,
    createdAt: "2024-03-01",
    cities: [
      { id: "ci12", countryId: "c3", nameEn: "Manama", nameAr: "\u0627\u0644\u0645\u0646\u0627\u0645\u0629", code: "BAH", isActive: true, facilitiesCount: 3, addressesCount: 15, createdAt: "2024-03-01" },
    ],
  },
  {
    id: "c4",
    nameEn: "Qatar",
    nameAr: "\u0642\u0637\u0631",
    code: "QA",
    isActive: false,
    createdAt: "2024-06-01",
    cities: [
      { id: "ci13", countryId: "c4", nameEn: "Doha", nameAr: "\u0627\u0644\u062f\u0648\u062d\u0629", code: "DOH", isActive: true, facilitiesCount: 0, addressesCount: 0, createdAt: "2024-06-01" },
    ],
  },
  {
    id: "c5",
    nameEn: "Kuwait",
    nameAr: "\u0627\u0644\u0643\u0648\u064a\u062a",
    code: "KW",
    isActive: false,
    createdAt: "2024-06-01",
    cities: [],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Country Form Modal ─────────────────────────────────────────────────────

function CountryFormModal({
  open,
  onClose,
  country,
  existingCountries,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  country: Country | null; // null = create, object = edit
  existingCountries: Country[];
  onSave: (data: { nameEn: string; nameAr: string; code: string; isActive: boolean }) => void;
}) {
  const isEdit = !!country;
  const [nameEn, setNameEn] = useState(country?.nameEn ?? "");
  const [nameAr, setNameAr] = useState(country?.nameAr ?? "");
  const [code, setCode] = useState(country?.code ?? "");
  const [isActive, setIsActive] = useState(country?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!nameEn.trim()) errs.nameEn = "Country name (English) is required.";
    else if (nameEn.trim().length < 2) errs.nameEn = "Country name must be at least 2 characters.";
    else if (existingCountries.some(c => c.id !== country?.id && c.nameEn.toLowerCase() === nameEn.trim().toLowerCase()))
      errs.nameEn = "A country with this name already exists.";

    if (!nameAr.trim()) errs.nameAr = "Country name (Arabic) is required.";
    else if (nameAr.trim().length < 2) errs.nameAr = "Country name (Arabic) must be at least 2 characters.";

    if (!code.trim()) errs.code = "Country code is required.";
    else if (!/^[A-Z]{2}$/.test(code.trim())) errs.code = "Country code must be 2 uppercase letters (e.g., SA).";
    else if (existingCountries.some(c => c.id !== country?.id && c.code === code.trim()))
      errs.code = "This country code is already in use.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({ nameEn: nameEn.trim(), nameAr: nameAr.trim(), code: code.trim().toUpperCase(), isActive });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Country" : "Add Country"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the country details." : "Add a new country to the platform."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="country-name-en">Country Name (EN) <span className="text-red-500">*</span></Label>
            <Input
              id="country-name-en"
              value={nameEn}
              onChange={(e) => { setNameEn(e.target.value); setErrors(p => ({ ...p, nameEn: "" })); }}
              placeholder="Enter country name in English"
              maxLength={100}
              className={errors.nameEn ? "border-red-400" : ""}
            />
            {errors.nameEn && <p className="text-xs text-red-500">{errors.nameEn}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country-name-ar">Country Name (AR) <span className="text-red-500">*</span></Label>
            <Input
              id="country-name-ar"
              value={nameAr}
              onChange={(e) => { setNameAr(e.target.value); setErrors(p => ({ ...p, nameAr: "" })); }}
              placeholder="Enter country name in Arabic"
              maxLength={100}
              lang="ar"
              dir="rtl"
              className={errors.nameAr ? "border-red-400" : ""}
            />
            {errors.nameAr && <p className="text-xs text-red-500">{errors.nameAr}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country-code">Country Code <span className="text-red-500">*</span></Label>
            <Input
              id="country-code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, code: "" })); }}
              placeholder="e.g., SA, AE"
              maxLength={2}
              className={cn("uppercase", errors.code ? "border-red-400" : "")}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="country-status" className="text-sm">Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{isActive ? "Active" : "Inactive"}</span>
              <Switch id="country-status" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#003B95] hover:bg-[#002a6b]">
            {isEdit ? "Save Changes" : "Add Country"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── City Form Modal ────────────────────────────────────────────────────────

function CityFormModal({
  open,
  onClose,
  city,
  parentCountry,
  existingCities,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  city: City | null; // null = create
  parentCountry: Country;
  existingCities: City[];
  onSave: (data: { nameEn: string; nameAr: string; code: string; isActive: boolean }) => void;
}) {
  const isEdit = !!city;
  const [nameEn, setNameEn] = useState(city?.nameEn ?? "");
  const [nameAr, setNameAr] = useState(city?.nameAr ?? "");
  const [code, setCode] = useState(city?.code ?? "");
  const [isActive, setIsActive] = useState(city?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!nameEn.trim()) errs.nameEn = "City name (English) is required.";
    else if (nameEn.trim().length < 2) errs.nameEn = "City name must be at least 2 characters.";
    else if (existingCities.some(c => c.id !== city?.id && c.nameEn.toLowerCase() === nameEn.trim().toLowerCase()))
      errs.nameEn = "A city with this name already exists in this country.";

    if (!nameAr.trim()) errs.nameAr = "City name (Arabic) is required.";
    else if (nameAr.trim().length < 2) errs.nameAr = "City name (Arabic) must be at least 2 characters.";

    if (!code.trim()) errs.code = "City code is required.";
    else if (!/^[A-Z0-9]{2,5}$/.test(code.trim())) errs.code = "City code must be 2-5 uppercase alphanumeric characters.";
    else if (existingCities.some(c => c.id !== city?.id && c.code === code.trim()))
      errs.code = "This city code is already in use within this country.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({ nameEn: nameEn.trim(), nameAr: nameAr.trim(), code: code.trim().toUpperCase(), isActive });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit City" : "Add City"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the city details." : `Add a new city to ${parentCountry.nameEn}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Parent country (read-only) */}
          <div className="space-y-1.5">
            <Label>Parent Country</Label>
            <Input value={`${parentCountry.nameEn} (${parentCountry.code})`} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city-name-en">City Name (EN) <span className="text-red-500">*</span></Label>
            <Input
              id="city-name-en"
              value={nameEn}
              onChange={(e) => { setNameEn(e.target.value); setErrors(p => ({ ...p, nameEn: "" })); }}
              placeholder="Enter city name in English"
              maxLength={200}
              className={errors.nameEn ? "border-red-400" : ""}
            />
            {errors.nameEn && <p className="text-xs text-red-500">{errors.nameEn}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city-name-ar">City Name (AR) <span className="text-red-500">*</span></Label>
            <Input
              id="city-name-ar"
              value={nameAr}
              onChange={(e) => { setNameAr(e.target.value); setErrors(p => ({ ...p, nameAr: "" })); }}
              placeholder="Enter city name in Arabic"
              maxLength={200}
              lang="ar"
              dir="rtl"
              className={errors.nameAr ? "border-red-400" : ""}
            />
            {errors.nameAr && <p className="text-xs text-red-500">{errors.nameAr}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city-code">City Code <span className="text-red-500">*</span></Label>
            <Input
              id="city-code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrors(p => ({ ...p, code: "" })); }}
              placeholder="e.g., RUH, JED"
              maxLength={5}
              className={cn("uppercase", errors.code ? "border-red-400" : "")}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="city-status" className="text-sm">Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{isActive ? "Active" : "Inactive"}</span>
              <Switch id="city-status" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#003B95] hover:bg-[#002a6b]">
            {isEdit ? "Save Changes" : "Add City"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function CountryManagementPage() {
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState("");

  // Modals
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "city"; city: City } | null>(null);

  // Cities pagination
  const [citiesPage, setCitiesPage] = useState(1);
  const [citiesPageSize, setCitiesPageSize] = useState(10);
  const [citiesSortField, setCitiesSortField] = useState<"nameEn" | "nameAr" | "code" | "isActive">("nameEn");
  const [citiesSortDir, setCitiesSortDir] = useState<"asc" | "desc">("asc");

  // ─── Derived ──────────────────────────────────────────────
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase();
    return countries.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.includes(countrySearch) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, countrySearch]);

  const selectedCountry = countries.find((c) => c.id === selectedCountryId) ?? null;

  const sortedCities = useMemo(() => {
    if (!selectedCountry) return [];
    const sorted = [...selectedCountry.cities].sort((a, b) => {
      const aVal = a[citiesSortField];
      const bVal = b[citiesSortField];
      if (typeof aVal === "boolean") return citiesSortDir === "asc" ? (aVal ? 1 : -1) : (aVal ? -1 : 1);
      return citiesSortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [selectedCountry, citiesSortField, citiesSortDir]);

  const totalCities = sortedCities.length;
  const totalCitiesPages = Math.max(1, Math.ceil(totalCities / citiesPageSize));
  const paginatedCities = sortedCities.slice((citiesPage - 1) * citiesPageSize, citiesPage * citiesPageSize);

  // ─── Country CRUD ─────────────────────────────────────────

  function openAddCountry() {
    setEditingCountry(null);
    setCountryModalOpen(true);
  }

  function openEditCountry() {
    if (!selectedCountry) return;
    setEditingCountry(selectedCountry);
    setCountryModalOpen(true);
  }

  function handleSaveCountry(data: { nameEn: string; nameAr: string; code: string; isActive: boolean }) {
    if (editingCountry) {
      // Edit
      setCountries((prev) =>
        prev.map((c) =>
          c.id === editingCountry.id
            ? { ...c, nameEn: data.nameEn, nameAr: data.nameAr, code: data.code, isActive: data.isActive }
            : c
        )
      );
      toast.success("Country updated successfully.");
    } else {
      // Create
      const newCountry: Country = {
        id: generateId(),
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        code: data.code,
        isActive: data.isActive,
        cities: [],
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCountries((prev) => [...prev, newCountry]);
      setSelectedCountryId(newCountry.id);
      toast.success("Country created successfully.");
    }
    setCountryModalOpen(false);
  }

  // ─── City CRUD ────────────────────────────────────────────

  function openAddCity() {
    setEditingCity(null);
    setCityModalOpen(true);
  }

  function openEditCity(city: City) {
    setEditingCity(city);
    setCityModalOpen(true);
  }

  function handleSaveCity(data: { nameEn: string; nameAr: string; code: string; isActive: boolean }) {
    if (!selectedCountry) return;
    if (editingCity) {
      setCountries((prev) =>
        prev.map((c) =>
          c.id === selectedCountry.id
            ? {
                ...c,
                cities: c.cities.map((ci) =>
                  ci.id === editingCity.id
                    ? { ...ci, nameEn: data.nameEn, nameAr: data.nameAr, code: data.code, isActive: data.isActive }
                    : ci
                ),
              }
            : c
        )
      );
      toast.success("City updated successfully.");
    } else {
      const newCity: City = {
        id: generateId(),
        countryId: selectedCountry.id,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        code: data.code,
        isActive: data.isActive,
        facilitiesCount: 0,
        addressesCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCountries((prev) =>
        prev.map((c) =>
          c.id === selectedCountry.id ? { ...c, cities: [...c.cities, newCity] } : c
        )
      );
      toast.success("City created successfully.");
    }
    setCityModalOpen(false);
  }

  function handleDeleteCity() {
    if (!deleteConfirm || deleteConfirm.type !== "city" || !selectedCountry) return;
    const city = deleteConfirm.city;
    const refs = city.facilitiesCount + city.addressesCount;
    if (refs > 0) {
      toast.error(`Cannot delete this city. It is referenced by ${city.facilitiesCount} facilities/${city.addressesCount} user addresses.`);
      setDeleteConfirm(null);
      return;
    }
    setCountries((prev) =>
      prev.map((c) =>
        c.id === selectedCountry.id ? { ...c, cities: c.cities.filter((ci) => ci.id !== city.id) } : c
      )
    );
    toast.success("City deleted successfully.");
    setDeleteConfirm(null);
  }

  function toggleSort(field: typeof citiesSortField) {
    if (citiesSortField === field) {
      setCitiesSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCitiesSortField(field);
      setCitiesSortDir("asc");
    }
    setCitiesPage(1);
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Location Master Data</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage countries and cities for the platform.</p>
        </div>
        <Button onClick={openAddCountry} className="bg-[#003B95] hover:bg-[#002a6b] gap-2">
          <Plus className="h-4 w-4" />
          Add Country
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
        {/* LEFT PANEL: Country List (320px) */}
        <div className="w-[320px] shrink-0 border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                className="pl-9 h-9 text-sm"
                aria-label="Search countries"
              />
              {countrySearch && (
                <button
                  onClick={() => setCountrySearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Country list */}
          <nav aria-label="Country list" className="flex-1 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Globe className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-900">
                  {countrySearch ? "No countries match your search." : "No Countries"}
                </p>
                {!countrySearch && (
                  <>
                    <p className="text-xs text-gray-500 mt-1">Add your first country to get started.</p>
                    <Button onClick={openAddCountry} variant="outline" size="sm" className="mt-3 gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add Country
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <ul role="listbox">
                {filteredCountries.map((country) => {
                  const isSelected = selectedCountryId === country.id;
                  return (
                    <li key={country.id} role="option" aria-selected={isSelected}>
                      <button
                        onClick={() => { setSelectedCountryId(country.id); setCitiesPage(1); }}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center gap-3 border-l-3 transition-colors",
                          isSelected
                            ? "bg-[#003B95]/5 border-l-[#003B95] border-l-[3px]"
                            : "border-l-transparent hover:bg-gray-50 border-l-[3px]",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{country.nameEn}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono shrink-0">
                              {country.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                country.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              )}
                            >
                              {country.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-[10px] text-gray-400">
                              {country.cities.length} {country.cities.length === 1 ? "city" : "cities"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-[#003B95]" : "text-gray-300")} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        </div>

        {/* RIGHT PANEL: Cities for Selected Country */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedCountry ? (
            /* No country selected placeholder */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MapPin className="h-12 w-12 text-gray-200 mb-4" />
              <p className="text-base font-medium text-gray-400">Select a country from the list to manage its cities.</p>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#111827]">{selectedCountry.nameEn}</h2>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      selectedCountry.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    )}
                  >
                    {selectedCountry.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">{selectedCountry.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={openEditCountry} className="gap-1.5 text-gray-600">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Country
                  </Button>
                  <Button onClick={openAddCity} size="sm" className="bg-[#003B95] hover:bg-[#002a6b] gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add City
                  </Button>
                </div>
              </div>

              {/* Cities table */}
              <div className="flex-1 overflow-auto">
                {selectedCountry.cities.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <MapPin className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-900">No Cities</p>
                    <p className="text-xs text-gray-500 mt-1">Add cities to this country.</p>
                    <Button onClick={openAddCity} variant="outline" size="sm" className="mt-3 gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add City
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("nameEn")}>
                          <div className="flex items-center gap-1">
                            City Name (EN)
                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("nameAr")}>
                          <div className="flex items-center gap-1">
                            City Name (AR)
                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("code")}>
                          <div className="flex items-center gap-1">
                            Code
                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("isActive")}>
                          <div className="flex items-center gap-1">
                            Status
                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCities.map((city) => (
                        <TableRow key={city.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">{city.nameEn}</TableCell>
                          <TableCell>
                            <span dir="rtl" lang="ar" className="text-gray-700">{city.nameAr}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {city.code}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px]",
                                city.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              )}
                            >
                              {city.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-[#003B95]"
                                onClick={() => openEditCity(city)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                onClick={() => setDeleteConfirm({ type: "city", city })}
                                aria-label={`Delete ${city.nameEn}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination */}
              {totalCities > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rows per page:</span>
                    <Select value={String(citiesPageSize)} onValueChange={(v) => { setCitiesPageSize(Number(v)); setCitiesPage(1); }}>
                      <SelectTrigger className="h-8 w-[70px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">
                      Showing {(citiesPage - 1) * citiesPageSize + 1}–{Math.min(citiesPage * citiesPageSize, totalCities)} of {totalCities}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={citiesPage <= 1}
                      onClick={() => setCitiesPage((p) => p - 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                    {Array.from({ length: totalCitiesPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === citiesPage ? "default" : "outline"}
                        size="icon"
                        className={cn("h-8 w-8 text-xs", page === citiesPage && "bg-[#003B95] hover:bg-[#002a6b]")}
                        onClick={() => setCitiesPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={citiesPage >= totalCitiesPages}
                      onClick={() => setCitiesPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Modals ──────────────────────────────────────────── */}

      {countryModalOpen && (
        <CountryFormModal
          open={countryModalOpen}
          onClose={() => setCountryModalOpen(false)}
          country={editingCountry}
          existingCountries={countries}
          onSave={handleSaveCountry}
        />
      )}

      {cityModalOpen && selectedCountry && (
        <CityFormModal
          open={cityModalOpen}
          onClose={() => setCityModalOpen(false)}
          city={editingCity}
          parentCountry={selectedCountry}
          existingCities={selectedCountry.cities}
          onSave={handleSaveCity}
        />
      )}

      {/* Delete city confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.city && (deleteConfirm.city.facilitiesCount + deleteConfirm.city.addressesCount) > 0
                ? `This city cannot be deleted because it is referenced by ${deleteConfirm.city.facilitiesCount} facilities and ${deleteConfirm.city.addressesCount} user addresses.`
                : `Are you sure you want to delete "${deleteConfirm?.city?.nameEn}"? This action is permanent.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteConfirm?.city && (deleteConfirm.city.facilitiesCount + deleteConfirm.city.addressesCount) === 0 && (
              <AlertDialogAction onClick={handleDeleteCity} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
