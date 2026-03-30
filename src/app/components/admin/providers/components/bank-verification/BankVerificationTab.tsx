import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../../ui/table";
import { Button } from "../../../../ui/button";
import { Badge } from "../../../../ui/badge";
import { Input } from "../../../../ui/input";
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Eye,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { TypeBadge, ProviderType } from "../TypeBadge";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { RejectionModal } from "./RejectionModal";
import { BankDetailsModal } from "./BankDetailsModal";

export interface BankVerificationRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  bankName: string;
  accountNumber: string;
  iban: string;
  documentUrl: string;
  documentName: string;
  status: "Pending" | "Verified" | "Rejected";
  rejectionReason?: string;
  submittedDate: string;
}

const MOCK_REQUESTS: BankVerificationRequest[] = [
  {
    id: "bv1",
    providerId: "1",
    providerName: "Ahmed Sports Academy",
    providerType: "TP",
    bankName: "Al Rajhi Bank",
    accountNumber: "**** 1234",
    iban: "SA1234567890123456789012",
    documentUrl: "#",
    documentName: "Bank_Letter_2023.pdf",
    status: "Pending",
    submittedDate: "2023-10-28T10:30:00Z"
  },
  {
    id: "bv2",
    providerId: "2",
    providerName: "Elite Fitness Center",
    providerType: "FC",
    bankName: "SNB",
    accountNumber: "**** 5678",
    iban: "SA9876543210987654321098",
    documentUrl: "#",
    documentName: "IBAN_Certificate.png",
    status: "Pending",
    submittedDate: "2023-10-27T14:15:00Z"
  },
  {
    id: "bv3",
    providerId: "3",
    providerName: "Coach Khalid",
    providerType: "FP",
    bankName: "Riyad Bank",
    accountNumber: "**** 9012",
    iban: "SA4567890123456789012345",
    documentUrl: "#",
    documentName: "Voided_Check.jpg",
    status: "Verified",
    submittedDate: "2023-10-25T09:00:00Z"
  },
  {
    id: "bv4",
    providerId: "4",
    providerName: "Riyadh Tennis Club",
    providerType: "FC",
    bankName: "SABB",
    accountNumber: "**** 3456",
    iban: "SA7890123456789012345678",
    documentUrl: "#",
    documentName: "Bank_Statement_Oct.pdf",
    status: "Rejected",
    rejectionReason: "Document is blurred and IBAN does not match.",
    submittedDate: "2023-10-20T11:45:00Z"
  }
];

export function BankVerificationTab() {
  const [requests, setRequests] = useState<BankVerificationRequest[]>(MOCK_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<BankVerificationRequest | null>(null);
  
  // Modal states
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredRequests = requests.filter(req => 
    req.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.iban.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Sort Pending first
    if (a.status === "Pending" && b.status !== "Pending") return -1;
    if (a.status !== "Pending" && b.status === "Pending") return 1;
    // Then by date desc
    return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
  });

  const handleOpenDetails = (req: BankVerificationRequest) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  const handleOpenDocument = (req: BankVerificationRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRequest(req);
    setIsDocumentOpen(true);
  };

  const handleApprove = (req: BankVerificationRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // In a real app, API call here
    const updatedRequests = requests.map(r => 
      r.id === req.id ? { ...r, status: "Verified" as const } : r
    );
    setRequests(updatedRequests);
    
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest({ ...selectedRequest, status: "Verified" });
    }
    
    toast.success("Bank account verified successfully", {
      description: `${req.providerName}'s account is now eligible for payouts.`
    });
  };

  const handleOpenReject = (req: BankVerificationRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedRequest(req);
    setIsRejectionOpen(true);
  };

  const handleReject = (reason: string) => {
    if (!selectedRequest) return;
    
    const updatedRequests = requests.map(r => 
      r.id === selectedRequest.id 
        ? { ...r, status: "Rejected" as const, rejectionReason: reason } 
        : r
    );
    setRequests(updatedRequests);
    
    // Update local state if details modal is open
    setSelectedRequest({ ...selectedRequest, status: "Rejected", rejectionReason: reason });
    
    toast.error("Bank account rejected", {
      description: `Reason: ${reason}`
    });
    
    setIsRejectionOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Bank Account Verifications</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search provider or IBAN..."
            className="pl-9"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bank Info</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <TableRow 
                  key={req.id}
                  className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  onClick={() => handleOpenDetails(req)}
                >
                  <TableCell className="font-medium text-slate-900">
                    {req.providerName}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={req.providerType} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{req.bankName}</span>
                      <span className="text-xs text-slate-500 font-mono tracking-wide">{req.iban}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                      onClick={(e) => handleOpenDocument(req, e)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="underline decoration-dotted underline-offset-4">View Doc</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      req.status === "Verified" ? "bg-green-50 text-green-700 border-green-200" :
                      req.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }>
                      {req.status === "Pending" && <ClockIcon className="mr-1 h-3 w-3" />}
                      {req.status === "Verified" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {req.status === "Rejected" && <XCircle className="mr-1 h-3 w-3" />}
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(req.submittedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === "Pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                          title="Verify"
                          onClick={(e) => handleApprove(req, e)}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                          title="Reject"
                          onClick={(e) => handleOpenReject(req, e)}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                    {req.status === "Rejected" && (
                      <Button variant="ghost" size="sm" className="h-8 text-slate-400" disabled>
                        Rejected
                      </Button>
                    )}
                    {req.status === "Verified" && (
                      <Button variant="ghost" size="sm" className="h-8 text-green-600" disabled>
                        Verified
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No bank verification requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentPreviewModal 
        isOpen={isDocumentOpen}
        onClose={() => setIsDocumentOpen(false)}
        request={selectedRequest}
      />

      <RejectionModal 
        isOpen={isRejectionOpen}
        onClose={() => setIsRejectionOpen(false)}
        onConfirm={handleReject}
      />

      <BankDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRequest}
        onApprove={() => selectedRequest && handleApprove(selectedRequest)}
        onReject={() => selectedRequest && handleOpenReject(selectedRequest)}
      />
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
