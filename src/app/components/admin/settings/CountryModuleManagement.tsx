import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../ui/table";
import { Switch } from "../../ui/switch";
import { Button } from "../../ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "../../ui/dialog";
import { toast } from "sonner";
import { Country, Module, CountryCode, ModuleId, CountryModuleSettings } from "./types";
import { cn } from "../../../lib/utils";
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

// Mock Data
const COUNTRIES: Country[] = [
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
];

const MODULES: Module[] = [
  { id: 'tournaments', name: 'Tournaments' },
  { id: 'subscriptions', name: 'Facility Subscriptions' },
  { id: 'coach-booking', name: 'Coach Booking' },
  { id: 'training-session', name: 'Training Per-Session' },
  { id: 'training-course', name: 'Training Full-Course' },
];

const INITIAL_SETTINGS: CountryModuleSettings = COUNTRIES.reduce((acc, country) => {
  acc[country.code] = MODULES.reduce((mAcc, module) => {
    mAcc[module.id] = true; // Default enabled
    return mAcc;
  }, {} as Record<ModuleId, boolean>);
  return acc;
}, {} as CountryModuleSettings);

export function CountryModuleManagement() {
  const [settings, setSettings] = useState<CountryModuleSettings>(INITIAL_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<CountryModuleSettings>(INITIAL_SETTINGS);
  const [pendingToggle, setPendingToggle] = useState<{ country: CountryCode, module: ModuleId } | null>(null);
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // Check for changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const handleToggle = (countryCode: CountryCode, moduleId: ModuleId, currentValue: boolean) => {
    const newValue = !currentValue;

    if (newValue === false) {
      // Disabling requires confirmation
      setPendingToggle({ country: countryCode, module: moduleId });
      setIsDisableConfirmOpen(true);
    } else {
      // Enabling happens immediately in local state
      updateSetting(countryCode, moduleId, newValue);
    }
  };

  const updateSetting = (countryCode: CountryCode, moduleId: ModuleId, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        [moduleId]: value
      }
    }));
  };

  const confirmDisable = () => {
    if (pendingToggle) {
      updateSetting(pendingToggle.country, pendingToggle.module, false);
      setPendingToggle(null);
      setIsDisableConfirmOpen(false);
    }
  };

  const handleSaveClick = () => {
    setIsSaveConfirmOpen(true);
  };

  const confirmSave = () => {
    // Simulate API call
    setTimeout(() => {
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      toast.success("Module settings updated");
      setIsSaveConfirmOpen(false);
    }, 500);
  };

  const isModified = (countryCode: CountryCode, moduleId: ModuleId) => {
    return settings[countryCode][moduleId] !== originalSettings[countryCode][moduleId];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Country Module Management</h2>
          <p className="text-muted-foreground">Enable or disable features per country.</p>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-gray-950 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] font-bold text-gray-900 dark:text-gray-100 min-w-[150px]">Country</TableHead>
              {MODULES.map(module => (
                <TableHead key={module.id} className="text-center min-w-[120px]">
                  <div className="flex items-center justify-center h-full">
                    <span className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                      {module.name}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {COUNTRIES.map(country => (
              <TableRow key={country.code}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2 text-[#111827] dark:text-gray-100 text-base">
                    <span className="text-2xl" role="img" aria-label={`Flag of ${country.name}`}>{country.flag}</span>
                    {country.name}
                  </span>
                </TableCell>
                {MODULES.map(module => {
                  const isEnabled = settings[country.code][module.id];
                  const modified = isModified(country.code, module.id);
                  
                  return (
                    <TableCell key={module.id} className="text-center p-4">
                      <div className="flex flex-col items-center justify-center gap-1 relative">
                        <div className="relative">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggle(country.code, module.id, isEnabled)}
                            className={cn(
                              "data-[state=checked]:bg-[#003B95]",
                              // If disabled state styling needed, add here
                            )}
                          />
                          {modified && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveClick} 
          disabled={!hasChanges}
          className={cn(
            "bg-[#003B95] hover:bg-[#002a6b] transition-all",
            !hasChanges && "opacity-50 cursor-not-allowed"
          )}
        >
          Save Changes
        </Button>
      </div>

      {/* Confirmation for disabling a module */}
      <Dialog open={isDisableConfirmOpen} onOpenChange={setIsDisableConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {pendingToggle && (
                <>
                  Disabling <strong>{MODULES.find(m => m.id === pendingToggle.module)?.name}</strong> in{' '}
                  <strong>{COUNTRIES.find(c => c.code === pendingToggle.country)?.name}</strong> will hide it from all users in that country.
                  <br /><br />
                  Continue?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableConfirmOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#003B95] hover:bg-[#002a6b]" 
              onClick={confirmDisable}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation for saving changes */}
      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Country Modules?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update feature availability across all selected countries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave} className="bg-[#003B95] hover:bg-[#002a6b]">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
