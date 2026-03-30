import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { toast } from "sonner";
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

// Define promotion types and durations
const PROMO_TYPES = ["Featured", "Top Listed", "Highlighted"] as const;
const DURATIONS = ["1 Day", "1 Week", "1 Month", "3 Months"] as const;

// Create a schema that validates a price for each combination
const pricingSchema = z.object({
  prices: z.record(z.string(), z.record(z.string(), z.coerce.number().min(0, "Price must be positive"))),
});

type PricingValues = z.infer<typeof pricingSchema>;

export function PromotionPricing() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<PricingValues | null>(null);

  const form = useForm<PricingValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      prices: {
        Featured: { "1 Day": 100, "1 Week": 500, "1 Month": 1500, "3 Months": 4000 },
        "Top Listed": { "1 Day": 80, "1 Week": 400, "1 Month": 1200, "3 Months": 3000 },
        Highlighted: { "1 Day": 50, "1 Week": 250, "1 Month": 800, "3 Months": 2000 },
      },
    },
  });

  const onSubmit = (data: PricingValues) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      console.log("Saving Pricing:", pendingData);
      toast.success("Promotion pricing updated successfully");
      setPendingData(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Promotion Pricing</h2>
        <p className="text-muted-foreground">Set pricing for different promotion tiers and durations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Grid (SAR)</CardTitle>
          <CardDescription>Enter the price in SAR for each promotion type and duration combination.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] font-bold bg-gray-50">Promotion Type</TableHead>
                    {DURATIONS.map((duration) => (
                      <TableHead key={duration} className="text-center font-bold bg-gray-50 min-w-[100px]">
                        {duration}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PROMO_TYPES.map((type) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium bg-gray-50/50">{type}</TableCell>
                      {DURATIONS.map((duration) => (
                        <TableCell key={`${type}-${duration}`} className="p-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">SAR</span>
                            <Input
                              type="number"
                              className="pl-12 text-right"
                              {...form.register(`prices.${type}.${duration}` as const)}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#003B95] hover:bg-[#002a6b]">
                Save Pricing
              </Button>
            </div>
          </form>

          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save Pricing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update the promotion pricing for all new promotions.
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
