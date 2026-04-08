import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
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

const payoutSchema = z.object({
  minPayoutAmount: z.coerce
    .number()
    .min(1, "Minimum payout must be greater than 0"),
  processingDays: z.coerce
    .number()
    .min(1, "Processing days must be at least 1"),
  autoPayout: z.boolean(),
});

type PayoutValues = z.infer<typeof payoutSchema>;

export function PayoutSettings() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<PayoutValues | null>(null);

  const form = useForm<PayoutValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      minPayoutAmount: 500,
      processingDays: 3,
      autoPayout: false,
    },
  });

  const onSubmit = (data: PayoutValues) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      console.log("Saving Payout Settings:", pendingData);
      toast.success("Payout settings saved successfully");
      setPendingData(null);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-5 bg-[#F9FAFB] min-h-screen">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payout Settings</h2>
        <p className="text-muted-foreground">
          Configure payment processing rules and thresholds.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Configuration</CardTitle>
          <CardDescription>
            Control how and when payouts are processed for providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minPayoutAmount">
                  Minimum Payout Amount (SAR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    SAR
                  </span>
                  <Input
                    id="minPayoutAmount"
                    type="number"
                    className="pl-12"
                    {...form.register("minPayoutAmount")}
                  />
                </div>
                {form.formState.errors.minPayoutAmount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.minPayoutAmount.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Providers must reach this balance before a payout is
                  generated.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processingDays">Payout Processing Days</Label>
                <Input
                  id="processingDays"
                  type="number"
                  {...form.register("processingDays")}
                />
                {form.formState.errors.processingDays && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.processingDays.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of business days required to process a payout request.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 flex items-center justify-between border p-4 rounded-lg bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPayout" className="text-base font-medium">
                    Auto-Payout
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically process payouts when the minimum threshold is
                    reached.
                  </p>
                </div>
                <Switch
                  id="autoPayout"
                  checked={form.watch("autoPayout")}
                  onCheckedChange={(checked) =>
                    form.setValue("autoPayout", checked)
                  }
                  className="data-[state=checked]:bg-[#003B95]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#003B95] hover:bg-[#002a6b]">
                Save Payout Settings
              </Button>
            </div>
          </form>

          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save Payout Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update how provider payouts are processed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmSave}
                  className="bg-[#003B95] hover:bg-[#002a6b]"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
