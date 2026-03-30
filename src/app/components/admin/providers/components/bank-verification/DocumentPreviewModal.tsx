import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "../../../../ui/dialog";
import { Button } from "../../../../ui/button";
import { X, ExternalLink, Download } from "lucide-react";

interface BankVerificationRequest {
  providerName: string;
  documentName: string;
  documentUrl: string;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BankVerificationRequest | null;
}

export function DocumentPreviewModal({ isOpen, onClose, request }: DocumentPreviewModalProps) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div>
            <DialogTitle>{request.documentName}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Document submitted by <span className="font-semibold text-slate-700">{request.providerName}</span>
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="bg-slate-100 min-h-[500px] flex items-center justify-center p-8">
          {/* Mock Document Preview */}
          <div className="bg-white shadow-lg rounded-sm w-full max-w-2xl aspect-[1/1.4] flex flex-col items-center justify-center border border-slate-200 p-12 text-center">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ExternalLink className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Document Preview Unavailable</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              This is a mock preview. In a real application, the document PDF or Image would be rendered here.
            </p>
            <Button variant="outline">Open in New Tab</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
