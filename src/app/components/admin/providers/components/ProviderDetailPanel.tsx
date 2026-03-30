import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "../../../ui/sheet";
import { Button } from "../../../ui/button";
import { TypeBadge, ProviderType } from "./TypeBadge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Separator } from "../../../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { Textarea } from "../../../ui/textarea";
import { toast } from "sonner";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Star, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import { CascadePreview } from "./CascadePreview";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  status: "Active" | "Inactive" | "Pending Approval" | "Rejected";
  adminStatus: "Verified" | "Unverified" | "Flagged";
  rating: number;
  joinedDate: string;
  email: string;
  phone: string;
  description: string;
  documents: Document[];
  bankAccounts: BankAccount[];
  entities: Entity[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending" | "Rejected";
  url: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string; // Masked
  iban: string;
  isPrimary: boolean;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  status: "Active" | "Inactive";
}

interface ProviderDetailPanelProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (providerId: string, newStatus: Provider["status"]) => void;
}

export function ProviderDetailPanel({ provider, isOpen, onClose, onUpdateStatus }: ProviderDetailPanelProps) {
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isOverrideEntityOpen, setIsOverrideEntityOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  if (!provider) return null;

  const handleApprove = () => {
    onUpdateStatus(provider.id, "Active");
    toast.success("Provider approved. They will be notified.");
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    onUpdateStatus(provider.id, "Rejected");
    setIsRejectModalOpen(false);
    toast.success(`Provider rejected. Reason: ${rejectionReason}`);
    setRejectionReason("");
    onClose();
  };

  const handleDeactivate = () => {
    onUpdateStatus(provider.id, "Inactive");
    setIsDeactivateConfirmOpen(false);
    toast.success("Provider deactivated.");
    onClose();
  };

  const handleEntityOverride = () => {
    if (selectedEntity) {
      toast.success(`Override ${selectedEntity.name} to ${selectedEntity.status === "Active" ? "Inactive" : "Active"}?`);
      setIsOverrideEntityOpen(false);
      setSelectedEntity(null);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="overflow-y-auto sm:max-w-md md:max-w-lg lg:max-w-xl" side="right">
          <SheetHeader className="pb-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm mt-1">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${provider.name.replace(" ", "+")}&background=random`} />
                <AvatarFallback>{provider.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-xl">{provider.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <TypeBadge type={provider.type} className="scale-90 origin-left" />
                      <span className="text-gray-300">•</span>
                      <span className={
                        provider.status === "Active" ? "text-green-600 font-medium" :
                        provider.status === "Pending Approval" ? "text-amber-600 font-medium" :
                        provider.status === "Rejected" ? "text-red-600 font-medium" :
                        "text-slate-500 font-medium"
                      }>{provider.status}</span>
                    </SheetDescription>
                  </div>
                  <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                    {provider.rating.toFixed(1)}
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Riyadh, SA
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {new Date(provider.joinedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Action Buttons for Pending Providers */}
          {provider.status === "Pending Approval" && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setIsRejectModalOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Registration
              </Button>
            </div>
          )}

          {/* Action Buttons for Active Providers */}
          {provider.status === "Active" && (
            <div className="mb-6">
              <Button 
                variant="destructive" 
                className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                onClick={() => setIsDeactivateConfirmOpen(true)}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Deactivate Provider
              </Button>
            </div>
          )}

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="documents">Docs</TabsTrigger>
              <TabsTrigger value="banking">Bank</TabsTrigger>
              <TabsTrigger value="entities">Entities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">About</h3>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                    {provider.description || "No description provided."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Contact Email</h3>
                    <div className="text-sm">{provider.email}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Phone</h3>
                    <div className="text-sm">{provider.phone}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Admin Status</h3>
                    <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {provider.adminStatus}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              {provider.documents.length > 0 ? (
                <div className="space-y-2">
                  {provider.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-md hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          <div className="text-xs text-slate-500">{doc.type}</div>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full border ${
                        doc.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : 
                        doc.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {doc.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic">No documents uploaded.</div>
              )}
            </TabsContent>
            
            <TabsContent value="banking" className="space-y-4">
              {provider.bankAccounts.length > 0 ? (
                <div className="space-y-3">
                  {provider.bankAccounts.map((account) => (
                    <div key={account.id} className="p-4 border rounded-lg bg-slate-50 relative overflow-hidden">
                      {account.isPrimary && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-bl-md font-medium">
                          PRIMARY
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-8 w-8 bg-white rounded-full border flex items-center justify-center text-slate-400">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{account.bankName}</div>
                          <div className="font-mono text-sm text-slate-600 mt-1">{account.accountNumber}</div>
                          <div className="text-xs text-slate-400 mt-0.5">IBAN: {account.iban}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic">No bank accounts linked.</div>
              )}
            </TabsContent>
            
            <TabsContent value="entities" className="space-y-4">
              <div className="mb-2 text-sm text-slate-500">
                Manage the entities associated with this provider. Overriding status here will affect public visibility.
              </div>
              {provider.entities.length > 0 ? (
                <div className="space-y-2">
                  {provider.entities.map((entity) => (
                    <div key={entity.id} className="flex items-center justify-between p-3 bg-white border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{entity.name}</div>
                          <div className="text-xs text-slate-500">{entity.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          entity.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {entity.status}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-slate-700"
                          onClick={() => {
                            setSelectedEntity(entity);
                            setIsOverrideEntityOpen(true);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 italic">No entities found.</div>
              )}
            </TabsContent>
          </Tabs>

        </SheetContent>
      </Sheet>

      {/* Deactivation Cascade Modal */}
      <AlertDialog open={isDeactivateConfirmOpen} onOpenChange={setIsDeactivateConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Deactivate Provider?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All their entities will be hidden. Existing bookings continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <CascadePreview />

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-white border-none">
              Yes, Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Reason Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this provider. This will be sent to them via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea 
              placeholder="e.g., Incomplete documentation, Invalid business license..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>Reject Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entity Override Confirmation */}
      <AlertDialog open={isOverrideEntityOpen} onOpenChange={setIsOverrideEntityOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override Entity Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Override <strong>{selectedEntity?.name}</strong> to <strong>{selectedEntity?.status === "Active" ? "Inactive" : "Active"}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEntity(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEntityOverride}>Confirm Override</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
