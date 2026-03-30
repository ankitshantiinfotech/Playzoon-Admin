import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Building2, User, Users } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group";

// Validation Schema
const formSchema = z.object({
  type: z.enum(["FP", "TP", "FC"]),
  name: z.string().min(2, { message: "Name is required (min 2 chars)" }),
  email: z.string().email({ message: "Valid email required" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  city: z.string().min(2, { message: "City is required" }),
  orgName: z.string().optional(),
}).refine((data) => {
  // If type is FP or TP, orgName might be relevant based on prompt "FP/TP: Org Name"
  // However, usually FC (Facility) has an Org Name. 
  // But strictly following prompt: "FP/TP: Org Name".
  // Let's require it if user selects FP or TP? Or just optional?
  // The prompt says "Fields: Name, Email, Phone, Country, City. FP/TP: Org Name."
  // It implies Org Name is a field for FP/TP.
  return true;
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: FormValues) => void;
}

export function CreateProviderModal({ isOpen, onClose, onCreate }: CreateProviderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "FP",
      country: "Saudi Arabia",
      city: "Riyadh",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call and validation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock "Email taken" validation
    if (data.email === "taken@example.com") {
      setError("email", { message: "Already registered" });
      setIsSubmitting(false);
      return;
    }

    // Success
    toast.success("Provider created. Welcome email sent.");
    onCreate(data);
    reset();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Provider</DialogTitle>
          <DialogDescription>
            Create a provider account directly. They will receive an email to set up their password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          {/* Provider Type Selector */}
          <div className="space-y-3">
            <Label>Provider Type</Label>
            <RadioGroup
              defaultValue="FP"
              value={selectedType}
              onValueChange={(val) => setValue("type", val as "FP" | "TP" | "FC")}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="FP" id="fp" className="peer sr-only" />
                <Label
                  htmlFor="fp"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <User className="mb-2 h-6 w-6" />
                  <div className="text-center font-semibold">Freelance</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Individual coach</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="TP" id="tp" className="peer sr-only" />
                <Label
                  htmlFor="tp"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Users className="mb-2 h-6 w-6" />
                  <div className="text-center font-semibold">Team</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Academy / Group</div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="FC" id="fc" className="peer sr-only" />
                <Label
                  htmlFor="fc"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Building2 className="mb-2 h-6 w-6" />
                  <div className="text-center font-semibold">Facility</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">Venue / Club</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Full Name (Admin/Owner)</Label>
              <Input id="name" {...register("name")} placeholder="e.g. John Doe" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Org Name - Conditional for FP/TP as per prompt */}
            {(selectedType === "FP" || selectedType === "TP") && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" {...register("orgName")} placeholder="e.g. Pro Coaching Academy" />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email")} placeholder="name@example.com" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register("phone")} placeholder="+966 5..." />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} placeholder="Country" />
              {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="City" />
              {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
