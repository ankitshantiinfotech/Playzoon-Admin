import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../../../../ui/dialog";
import { Button } from "../../../../ui/button";
import { Textarea } from "../../../../ui/textarea";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function RejectionModal({ isOpen, onClose, onConfirm }: RejectionModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Bank Account</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Please provide a reason for rejecting this bank account. This reason will be shared with the provider.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-2">
          <label htmlFor="reason" className="text-sm font-medium text-slate-700">Reason for Rejection</label>
          <Textarea 
            id="reason"
            placeholder="e.g., The IBAN provided does not match the bank letter."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">This field is required.</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={!reason.trim()}
            className="w-full sm:w-auto"
          >
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
