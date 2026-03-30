import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { 
  ArrowLeft, 
  Settings, 
  MapPin, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Trophy, 
  Building2, 
  Dumbbell, 
  User, 
  Wallet, 
  MessageCircle,
  Percent,
  Landmark,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { LegacyCountry as Country } from "./types";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

// Reusing the mock data for now (in a real app this would be an API call)
const initialCountries: Country[] = [
  {
    id: "AE",
    name: "United Arab Emirates",
    code: "AE",
    flagEmoji: "🇦🇪",
    isActive: true,
    modules: { tournaments: true, facilities: true, trainings: true, coaches: true, wallet: true, chat: true },
    settings: { 
      currency: "AED", 
      defaultCity: "Dubai", 
      commissionRates: { tournaments: 10, facilities: 12, trainings: 15, coaches: 15 }, 
      taxRate: 5 
    }
  },
  {
    id: "SA",
    name: "Saudi Arabia",
    code: "SA",
    flagEmoji: "🇸🇦",
    isActive: true,
    modules: { tournaments: true, facilities: true, trainings: false, coaches: false, wallet: true, chat: true },
    settings: { 
      currency: "SAR", 
      defaultCity: "Riyadh", 
      commissionRates: { tournaments: 15, facilities: 15, trainings: 15, coaches: 15 }, 
      taxRate: 15 
    }
  },
  // ... other countries would be here
];

const currencies = [
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "USD", name: "US Dollar" },
];

export function CountryConfigurationPage() {
  const { id } = useParams<{ id: string }>();
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const found = initialCountries.find(c => c.id === id);
    if (found) {
      setCountry(JSON.parse(JSON.stringify(found))); // Deep copy to avoid mutating initial state directly
    }
    setLoading(false);
  }, [id]);

  const handleModuleToggle = (moduleKey: keyof Country['modules']) => {
    if (!country) return;
    setCountry({
      ...country,
      modules: {
        ...country.modules,
        [moduleKey]: !country.modules[moduleKey]
      }
    });
  };

  const handleSettingChange = (settingKey: keyof Country['settings'], value: any) => {
    if (!country) return;
    setCountry({
      ...country,
      settings: {
        ...country.settings,
        [settingKey]: value
      }
    });
  };

  const handleCommissionChange = (type: keyof Country['settings']['commissionRates'], value: string) => {
    if (!country) return;
    const numValue = parseFloat(value) || 0;
    setCountry({
      ...country,
      settings: {
        ...country.settings,
        commissionRates: {
          ...country.settings.commissionRates,
          [type]: numValue
        }
      }
    });
  };

  const handleSave = () => {
    // Simulate API call
    toast.success("Configuration saved successfully", {
      description: `Settings for ${country?.name} have been updated.`
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading country configuration...</div>;
  }

  if (!country) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Country not found</h2>
        <Link to="/countries" className="text-blue-600 hover:underline mt-2 inline-block">
          Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/countries" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label={`Flag of ${country.name}`}>
                {country.flagEmoji}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{country.name}</h1>
              {country.isActive ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-1">Configure modules, currency, and financial settings.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/countries">Cancel</Link>
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Module Toggles */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Module Configuration
              </CardTitle>
              <CardDescription>
                Enable or disable platform features for users in this country.
                <br />
                <span className="text-amber-600 text-xs font-medium flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  Disabling a module hides it immediately for all users.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900 cursor-pointer" htmlFor="mod-tournaments">Tournaments</Label>
                    <p className="text-sm text-gray-500 mt-0.5">Allow users to create and join tournaments.</p>
                  </div>
                </div>
                <Switch 
                  id="mod-tournaments" 
                  checked={country.modules.tournaments} 
                  onCheckedChange={() => handleModuleToggle('tournaments')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900 cursor-pointer" htmlFor="mod-facilities">Facility Bookings</Label>
                    <p className="text-sm text-gray-500 mt-0.5">Enable searching and booking sports venues.</p>
                  </div>
                </div>
                <Switch 
                  id="mod-facilities" 
                  checked={country.modules.facilities} 
                  onCheckedChange={() => handleModuleToggle('facilities')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900 cursor-pointer" htmlFor="mod-trainings">Training Bookings</Label>
                    <p className="text-sm text-gray-500 mt-0.5">Enable booking training sessions with academies.</p>
                  </div>
                </div>
                <Switch 
                  id="mod-trainings" 
                  checked={country.modules.trainings} 
                  onCheckedChange={() => handleModuleToggle('trainings')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900 cursor-pointer" htmlFor="mod-coaches">Coach Bookings</Label>
                    <p className="text-sm text-gray-500 mt-0.5">Enable finding and booking freelance coaches.</p>
                  </div>
                </div>
                <Switch 
                  id="mod-coaches" 
                  checked={country.modules.coaches} 
                  onCheckedChange={() => handleModuleToggle('coaches')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900 cursor-pointer" htmlFor="mod-wallet">Digital Wallet</Label>
                    <p className="text-sm text-gray-500 mt-0.5">Required for payments, refunds, and rewards.</p>
                  </div>
                </div>
                <Switch 
                  id="mod-wallet" 
                  checked={country.modules.wallet} 
                  onCheckedChange={() => handleModuleToggle('wallet')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900 cursor-pointer" htmlFor="mod-chat">In-App Chat</Label>
                    <p className="text-sm text-gray-500 mt-0.5">Allow users to message providers directly.</p>
                  </div>
                </div>
                <Switch 
                  id="mod-chat" 
                  checked={country.modules.chat} 
                  onCheckedChange={() => handleModuleToggle('chat')} 
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6">
          
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="w-4 h-4 text-gray-500" />
                Regional Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={country.settings.currency} 
                  onValueChange={(val) => handleSettingChange('currency', val)}
                >
                  <SelectTrigger id="currency" className="bg-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCity">Default City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input 
                    id="defaultCity" 
                    value={country.settings.defaultCity}
                    onChange={(e) => handleSettingChange('defaultCity', e.target.value)}
                    className="pl-9" 
                    placeholder="e.g. Dubai" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (VAT) %</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input 
                    id="taxRate" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={country.settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                    className="pl-9" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Platform Commission (%)
              </CardTitle>
              <CardDescription className="text-xs">
                Percentage taken from each booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="com-tournaments" className="text-xs text-gray-500">Tournaments</Label>
                  <Input 
                    id="com-tournaments" 
                    type="number"
                    value={country.settings.commissionRates.tournaments}
                    onChange={(e) => handleCommissionChange('tournaments', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="com-facilities" className="text-xs text-gray-500">Facilities</Label>
                  <Input 
                    id="com-facilities" 
                    type="number"
                    value={country.settings.commissionRates.facilities}
                    onChange={(e) => handleCommissionChange('facilities', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="com-trainings" className="text-xs text-gray-500">Trainings</Label>
                  <Input 
                    id="com-trainings" 
                    type="number"
                    value={country.settings.commissionRates.trainings}
                    onChange={(e) => handleCommissionChange('trainings', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="com-coaches" className="text-xs text-gray-500">Coaches</Label>
                  <Input 
                    id="com-coaches" 
                    type="number"
                    value={country.settings.commissionRates.coaches}
                    onChange={(e) => handleCommissionChange('coaches', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
