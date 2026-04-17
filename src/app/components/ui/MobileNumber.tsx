import React, { useMemo } from "react";
import PhoneInput, {
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "./utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const phoneStyles = `
  .mobile-number-wrap .PhoneInput {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mobile-number-wrap .PhoneInputCountry {
    display: flex;
    align-items: center;
    margin: 0;
  }
  .mobile-number-wrap [data-slot="select-trigger"] {
    display: flex;
    align-items: center;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    height: 40px;
    background: #ffffff;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    width: auto;
    min-width: 70px;
  }
  .mobile-number-wrap [data-slot="select-trigger"]:focus {
    border-color: #003b95;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(0, 59, 149, 0.08);
  }
  .mobile-number-wrap .PhoneInputInput {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    outline: none;
    font-size: 14px;
    background: #ffffff;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: #1f2937;
  }
  .mobile-number-wrap .PhoneInputInput:focus {
    border-color: #003b95;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(0, 59, 149, 0.08);
  }
  .mobile-number-wrap .PhoneInputInput::placeholder {
    color: #9ca3af;
  }
  .mobile-number-wrap [data-slot="select-value"] .country-name {
    display: none;
  }
`;

function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  iconComponent: Icon,
  fallbackCountry = "SA",
}: {
  value?: Country;
  onChange: (value: Country) => void;
  options: { value: Country; label: string }[];
  disabled?: boolean;
  /** react-phone-number-input CountryIcon requires `label` (country name for a11y). */
  iconComponent: React.ComponentType<{
    country?: Country;
    label: string;
    aspectRatio?: number;
    "aria-hidden"?: boolean;
  }>;
  /** Matches PhoneInput `defaultCountry` when `value` is not yet set. */
  fallbackCountry?: Country;
}) {
  const sortedOptions = useMemo(() => {
    return [...options]
      .filter((opt) => opt.value)
      .sort((a, b) => String(a.label ?? "").localeCompare(String(b.label ?? "")));
  }, [options]);

  /** PhoneInput types allow `undefined`; flag component requires a CountryCode. */
  const countryForFlag: Country = value ?? fallbackCountry;

  /** CountryIcon (react-phone-number-input) requires `label` for a11y / Flag countryName. */
  const selectedOption = sortedOptions.find((o) => o.value === countryForFlag);
  const selectedLabel =
    (selectedOption?.label && String(selectedOption.label)) ||
    String(countryForFlag ?? "");

  return (
    <Select value={countryForFlag} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="flex-none transition-all">
        <SelectValue>
          <Icon
            aria-hidden
            country={countryForFlag}
            label={selectedLabel}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px] border-neutral-200 shadow-2xl rounded-xl">
        {sortedOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="py-2.5 rounded-lg focus:bg-primary-500/5"
          >
            <div className="flex items-center gap-2.5 w-full">
              <Icon
                aria-hidden
                country={option.value}
                label={
                  (option.label && String(option.label)) ||
                  String(option.value ?? "")
                }
              />
              <span className="country-name flex-1 text-sm text-neutral-700">
                {option.label}
              </span>
              <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                +{getCountryCallingCode(option.value)}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface MobileNumberProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  defaultCountry?: Country;
}

export default function MobileNumber({
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  className,
  defaultCountry = "SA",
}: MobileNumberProps) {
  return (
    <div className={cn("mobile-number-wrap w-full", className)}>
      <style>{phoneStyles}</style>
      <PhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value}
        onChange={(val) => onChange(val || "")}
        onBlur={onBlur}
        disabled={disabled}
        countrySelectComponent={(props) => (
          <CountrySelect {...props} fallbackCountry={defaultCountry} />
        )}
        className={cn(
          "transition-all",
          error && [
            "[&_>_[data-slot=select-trigger]]:border-red-300 [&_>_[data-slot=select-trigger]]:bg-red-50",
            "[&_.PhoneInputInput]:border-red-300 [&_.PhoneInputInput]:bg-red-50",
          ],
        )}
      />
    </div>
  );
}
