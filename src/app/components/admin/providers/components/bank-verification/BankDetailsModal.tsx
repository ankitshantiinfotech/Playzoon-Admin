import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../../../../ui/dialog";
import { Button } from "../../../../ui/button";
import { Badge } from "../../../../ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  Copy,
  Building2,
  FileText
} from "lucide-react";
import { BankVerificationRequest } from "./BankVerificationTab";

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BankVerificationRequest | null;
  onApprove: (request: BankVerificationRequest) => void;
  onReject: (request: BankVerificationRequest) => void;
}

export function BankDetailsModal({ isOpen, onClose, request, onApprove, onReject }: BankDetailsModalProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Bank Verification Request</DialogTitle>
              <DialogDescription className="mt-1">
                Review bank details submitted by <span className="font-semibold text-slate-900">{request.providerName}</span>
              </DialogDescription>
            </div>
            <Badge variant="outline" className={
              request.status === "Verified" ? "bg-green-50 text-green-700 border-green-200" :
              request.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }>
              {request.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* Left Column: Bank Details */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Information</h3>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Bank Name</div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {request.bankName}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-100 relative group">
                <div className="text-sm text-slate-500 mb-1">IBAN</div>
                <div className="font-mono text-slate-900 tracking-wide break-all">
                  {request.iban}
                </div>
                <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Account Number</div>
                <div className="font-mono text-slate-900 tracking-wide">
                  {request.accountNumber}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-sm text-slate-500 mb-2">Submission Date</div>
              <div className="text-slate-900">
                {new Date(request.submittedDate).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Right Column: Document Preview (Simplified) */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Supporting Document</h3>
            
            <div className="border rounded-lg p-4 bg-slate-50 h-full flex flex-col items-center justify-center text-center min-h-[250px]">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <div className="font-medium text-slate-900 mb-1">{request.documentName}</div>
              <Button variant="outline" size="sm" className="mt-4 gap-2">
                <ExternalLink className="h-3 w-3" />
                Preview Document
              </Button>
            </div>
          </div>
        </div>

        {request.status === "Rejected" && request.rejectionReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
            <span className="font-bold mr-1">Rejection Reason:</span>
            {request.rejectionReason}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {request.status === "Pending" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="destructive" 
                onClick={() => onReject(request)}
                className="flex-1 sm:flex-none gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button 
                onClick={() => onApprove(request)}
                className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verify Account
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
