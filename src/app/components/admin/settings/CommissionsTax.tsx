import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
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
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
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

const commissionSchema = z.object({
  countries: z.array(
    z.object({
      country: z.string().min(1, "Country is required"),
      fpCommission: z.coerce.number().min(0, "Commission must be between 0% and 100%").max(100, "Commission must be between 0% and 100%"),
      tpCommission: z.coerce.number().min(0, "Commission must be between 0% and 100%").max(100, "Commission must be between 0% and 100%"),
      fcCommission: z.coerce.number().min(0, "Commission must be between 0% and 100%").max(100, "Commission must be between 0% and 100%"),
      vat: z.coerce.number().min(0, "Tax rate must be between 0% and 100%").max(100, "Tax rate must be between 0% and 100%"),
    })
  ),
});

type CommissionValues = z.infer<typeof commissionSchema>;

const COUNTRIES_LIST = [
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Bahrain",
  "Kuwait",
  "Oman",
  "Egypt",
  "Jordan",
];

export function CommissionsTax() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<CommissionValues | null>(null);

  const form = useForm<CommissionValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      countries: [
        { country: "Saudi Arabia", fpCommission: 15, tpCommission: 10, fcCommission: 5, vat: 15 },
        { country: "UAE", fpCommission: 15, tpCommission: 10, fcCommission: 5, vat: 5 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "countries",
  });

  const onSubmit = (data: CommissionValues) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      console.log("Saving Commissions:", pendingData);
      toast.success("Commission settings saved successfully");
      setPendingData(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Commissions & Tax</h2>
        <p className="text-muted-foreground">Manage commission rates and tax percentages per country.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Rates</CardTitle>
          <CardDescription>
            Set the platform commission and applicable VAT/Tax for each country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Country</TableHead>
                    <TableHead>FP Commission %</TableHead>
                    <TableHead>TP Commission %</TableHead>
                    <TableHead>FC Commission %</TableHead>
                    <TableHead>VAT/Tax %</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          defaultValue={field.country}
                          onValueChange={(value) => form.setValue(`countries.${index}.country`, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Country" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES_LIST.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.countries?.[index]?.country && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.countries[index]?.country?.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...form.register(`countries.${index}.fpCommission` as const)}
                          min={0}
                          max={100}
                        />
                         {form.formState.errors.countries?.[index]?.fpCommission && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.countries[index]?.fpCommission?.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...form.register(`countries.${index}.tpCommission` as const)}
                          min={0}
                          max={100}
                        />
                         {form.formState.errors.countries?.[index]?.tpCommission && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.countries[index]?.tpCommission?.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...form.register(`countries.${index}.fcCommission` as const)}
                          min={0}
                          max={100}
                        />
                         {form.formState.errors.countries?.[index]?.fcCommission && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.countries[index]?.fcCommission?.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          {...form.register(`countries.${index}.vat` as const)}
                          min={0}
                          max={100}
                        />
                         {form.formState.errors.countries?.[index]?.vat && (
                          <p className="text-xs text-red-500 mt-1">{form.formState.errors.countries[index]?.vat?.message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ country: "", fpCommission: 0, tpCommission: 0, fcCommission: 0, vat: 0 })}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add Country
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Example Calculation:</p>
              <p>
                For facility bookings in Saudi Arabia: Provider receives 85% (15% commission), plus 15% VAT applied to player.
              </p>
            </div>
            
             <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
               <p className="font-medium">Note:</p>
               <p>Updating commissions affects all new bookings. Existing bookings retain their original commission rates.</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#003B95] hover:bg-[#002a6b]">
                Save Commissions
              </Button>
            </div>
          </form>

          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save Commissions?</AlertDialogTitle>
                <AlertDialogDescription>
                  Updating commissions affects all new bookings. Existing bookings retain their original commission rates.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSave} className="bg-[#003B95] hover:bg-[#002a6b]">Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
