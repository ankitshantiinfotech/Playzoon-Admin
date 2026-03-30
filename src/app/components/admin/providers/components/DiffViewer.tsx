import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "../../../ui/button";

interface DiffViewerProps {
  changeRequest: ChangeRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export interface ChangeRequest {
  id: string;
  providerName: string;
  submittedAt: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: "Pending" | "Approved" | "Rejected";
}

export function DiffViewer({ changeRequest, onApprove, onReject }: DiffViewerProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{changeRequest.providerName}</span>
          <span className="text-slate-500 text-sm">requested a change to</span>
          <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-sm text-slate-700">{changeRequest.field}</span>
        </div>
        <div className="text-xs text-slate-400">
          {new Date(changeRequest.submittedAt).toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 divide-x">
        {/* Old Value */}
        <div className="p-4 bg-red-50/30">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Original Value</div>
          <div className="text-slate-800 font-medium whitespace-pre-wrap">{changeRequest.oldValue}</div>
        </div>
        
        {/* New Value */}
        <div className="p-4 bg-green-50/30 relative">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Proposed Value</div>
          <div className="text-slate-800 font-medium whitespace-pre-wrap">{changeRequest.newValue}</div>
        </div>
      </div>

      <div className="bg-slate-50 px-4 py-3 flex justify-end gap-2 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={() => onReject(changeRequest.id)}
        >
          <X className="h-4 w-4 mr-1.5" />
          Reject
        </Button>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => onApprove(changeRequest.id)}
        >
          <Check className="h-4 w-4 mr-1.5" />
          Approve Change
        </Button>
      </div>
    </div>
  );
}
