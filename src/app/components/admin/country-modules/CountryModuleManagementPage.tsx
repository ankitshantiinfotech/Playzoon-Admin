import { useState } from "react";
import { toast } from "sonner";
import { Globe, Save, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import type { CountryModules, ModuleKey, AuditEntry } from "./types";
import { MODULE_LABELS } from "./types";
import {
  INITIAL_COUNTRY_MODULES,
  INITIAL_AUDIT_ENTRIES,
} from "./mockData";

const MODULE_KEYS: ModuleKey[] = [
  "player",
  "freelancerCoach",
  "trainingProvider",
  "facilityProvider",
  "tournaments",
];

export function CountryModuleManagementPage() {
  const [countryModules, setCountryModules] = useState<CountryModules[]>(
    INITIAL_COUNTRY_MODULES
  );
  const [auditEntries, setAuditEntries] =
    useState<AuditEntry[]>(INITIAL_AUDIT_ENTRIES);
  const [selectedCountryId, setSelectedCountryId] = useState<string>(
    INITIAL_COUNTRY_MODULES[0].countryId
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedCountry = countryModules.find(
    (c) => c.countryId === selectedCountryId
  );

  function handleToggleModule(moduleKey: ModuleKey) {
    if (!selectedCountry) return;
    setCountryModules((prev) =>
      prev.map((c) =>
        c.countryId === selectedCountryId
          ? { ...c, [moduleKey]: !c[moduleKey] }
          : c
      )
    );
    setHasUnsavedChanges(true);
  }

  function handleSaveChanges() {
    if (!selectedCountry) return;

    // Find the current state to create audit entries
    const current = countryModules.find(
      (c) => c.countryId === selectedCountryId
    );
    const original = INITIAL_COUNTRY_MODULES.find(
      (c) => c.countryId === selectedCountryId
    );

    if (current && original) {
      const newEntries: AuditEntry[] = [];
      for (const key of MODULE_KEYS) {
        if (current[key] !== original[key]) {
          newEntries.push({
            id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            editedBy: "Admin (Current User)",
            country: current.countryName,
            field: MODULE_LABELS[key],
            oldValue: original[key] ? "Enabled" : "Disabled",
            newValue: current[key] ? "Enabled" : "Disabled",
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          });
        }
      }
      if (newEntries.length > 0) {
        setAuditEntries((prev) => [...newEntries, ...prev]);
      }
    }

    setHasUnsavedChanges(false);
    toast.success(
      `Module configuration for ${selectedCountry.countryName} saved successfully.`
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">
          Country Module Management
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Configure which modules are available per country
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm min-h-[480px]">
        {/* LEFT PANEL: Country List */}
        <div className="w-[280px] shrink-0 border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Countries</h2>
          </div>
          <nav aria-label="Country list" className="flex-1 overflow-y-auto">
            <ul role="listbox">
              {countryModules.map((country) => {
                const isSelected = selectedCountryId === country.countryId;
                const enabledCount = MODULE_KEYS.filter(
                  (k) => country[k]
                ).length;
                return (
                  <li
                    key={country.countryId}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <button
                      onClick={() => {
                        setSelectedCountryId(country.countryId);
                        setHasUnsavedChanges(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 border-l-[3px] transition-colors",
                        isSelected
                          ? "bg-[#003B95]/5 border-l-[#003B95]"
                          : "border-l-transparent hover:bg-gray-50"
                      )}
                    >
                      <Globe
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "text-[#003B95]" : "text-gray-400"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {country.countryName}
                          </span>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {country.countryCode}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {enabledCount}/{MODULE_KEYS.length} modules enabled
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* RIGHT PANEL: Module Toggles */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedCountry ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#111827]">
                    {selectedCountry.countryName}
                  </h2>
                  <span className="text-xs text-gray-400 font-mono">
                    {selectedCountry.countryCode}
                  </span>
                </div>
                <Button
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges}
                  className="bg-[#003B95] hover:bg-[#002a6b] gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>

              <div className="px-6 py-6 flex-1">
                <p className="text-sm text-gray-500 mb-6">
                  Toggle modules on or off for this country. When disabled, the
                  module will not appear in the header or homepage for users in{" "}
                  {selectedCountry.countryName}.
                </p>

                <div className="space-y-1">
                  {MODULE_KEYS.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">
                            {MODULE_LABELS[key]}
                          </Label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {selectedCountry[key]
                              ? "Visible to users in this country"
                              : "Hidden from users in this country"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            selectedCountry[key]
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          )}
                        >
                          {selectedCountry[key] ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={selectedCountry[key]}
                          onCheckedChange={() => handleToggleModule(key)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <Globe className="h-12 w-12 text-gray-200 mb-4" />
              <p className="text-base font-medium text-gray-400">
                Select a country to configure its modules.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <h2 className="text-lg font-semibold text-[#111827]">Audit Trail</h2>
        </div>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Edited By</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Date / Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-sm text-gray-500"
                  >
                    No audit entries found.
                  </TableCell>
                </TableRow>
              ) : (
                auditEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm text-gray-900 font-medium">
                      {entry.editedBy}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {entry.country}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {entry.field}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          entry.oldValue === "Enabled"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}
                      >
                        {entry.oldValue}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          entry.newValue === "Enabled"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}
                      >
                        {entry.newValue}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono text-xs">
                      {entry.timestamp}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
