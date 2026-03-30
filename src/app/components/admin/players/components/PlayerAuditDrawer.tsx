import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "../../../ui/utils";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { ScrollArea } from "../../../ui/scroll-area";
import { Separator } from "../../../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  X,
  Clock,
  User,
  Monitor,
  Copy,
  Check,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "../../../ui/input";
import { toast } from "sonner";
import type { PlayerRow, PlayerAuditEvent } from "../player-data";
import { getPlayerAuditEvents } from "../player-data";

// ─── Action styles ───────────────────────────────────────────

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  INSERT: { bg: "bg-emerald-50", text: "text-emerald-700" },
  UPDATE: { bg: "bg-blue-50", text: "text-blue-700" },
  DELETE: { bg: "bg-red-50", text: "text-red-600" },
};

// ─── Props ───────────────────────────────────────────────────

interface Props {
  player: PlayerRow;
  open: boolean;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────

export function PlayerAuditDrawer({ player, open, onClose }: Props) {
  const events = useMemo(() => getPlayerAuditEvents(player.id), [player.id]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<PlayerAuditEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const modules = useMemo(() => {
    const s = new Set(events.map((e) => e.module));
    return Array.from(s).sort();
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.field.toLowerCase().includes(q) &&
          !e.actor.toLowerCase().includes(q) &&
          !e.module.toLowerCase().includes(q)
        )
          return false;
      }
      if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      return true;
    });
  }, [events, search, moduleFilter, actionFilter]);

  const handleCopyJSON = (event: PlayerAuditEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#003B95]" />
              <h2 className="text-sm text-[#111827]">Audit Trail</h2>
            </div>
            <p className="text-xs text-[#6B7280]">
              {player.firstName} {player.lastName} — {player.id}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search field, actor, module…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-7 text-[11px] flex-1">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-7 text-[11px] flex-1">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events */}
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-2">
            {filtered.length > 0 ? (
              filtered.map((event) => {
                const isExpanded = expandedEvent === event.id;
                const ac = ACTION_COLORS[event.action];
                return (
                  <div key={event.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors",
                        isExpanded && "bg-gray-50"
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-[#003B95] shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={cn("text-[9px] font-mono", ac.bg, ac.text)}>
                            {event.action}
                          </Badge>
                          <code className="text-xs text-[#374151]">{event.field}</code>
                          <span className="text-[10px] text-gray-400">by {event.actor}</span>
                        </div>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                          {format(event.timestamp, "MMM d, yyyy HH:mm:ss")} · {event.module}
                        </p>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t bg-gray-50/50 space-y-3">
                        <div className="flex items-center gap-4 text-[10px] text-[#6B7280] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.actor} ({event.actorRole})
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            IP: {event.ipAddress}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                          <div className="space-y-1">
                            <p className="text-[10px] text-[#9CA3AF] font-sans">Old Value</p>
                            <div className={cn(
                              "rounded p-2 min-h-[40px]",
                              event.oldValue !== null ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"
                            )}>
                              <pre className="whitespace-pre-wrap break-all text-[#374151]">
                                {event.oldValue !== null ? JSON.stringify(event.oldValue, null, 2) : "null"}
                              </pre>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-[#9CA3AF] font-sans">New Value</p>
                            <div className={cn(
                              "rounded p-2 min-h-[40px]",
                              event.newValue !== null ? "bg-emerald-50 border border-emerald-100" : "bg-gray-50 border border-gray-100"
                            )}>
                              <pre className="whitespace-pre-wrap break-all text-[#374151]">
                                {event.newValue !== null ? JSON.stringify(event.newValue, null, 2) : "null"}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] gap-1"
                            onClick={() => setDetailEvent(event)}
                          >
                            Full Detail
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] gap-1"
                            onClick={() => handleCopyJSON(event)}
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            Copy JSON
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Search className="h-7 w-7 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-[#9CA3AF]">No audit events found</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-5 py-3 border-t text-[11px] text-[#9CA3AF] shrink-0">
          {filtered.length} of {events.length} events
        </div>
      </div>

      {/* Audit Event Detail Modal */}
      {detailEvent && (
        <Dialog open={!!detailEvent} onOpenChange={() => setDetailEvent(null)}>
          <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto z-[60]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                Audit Event Detail
                <Badge variant="secondary" className={cn("text-[9px] font-mono", ACTION_COLORS[detailEvent.action].bg, ACTION_COLORS[detailEvent.action].text)}>
                  {detailEvent.action}
                </Badge>
              </DialogTitle>
              <DialogDescription>{detailEvent.id}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-400">Timestamp:</span> <span className="text-[#374151]">{format(detailEvent.timestamp, "MMM d, yyyy HH:mm:ss")}</span></div>
                <div><span className="text-gray-400">Actor:</span> <span className="text-[#374151]">{detailEvent.actor} ({detailEvent.actorRole})</span></div>
                <div><span className="text-gray-400">Module:</span> <span className="text-[#374151]">{detailEvent.module}</span></div>
                <div><span className="text-gray-400">IP:</span> <span className="text-[#374151] font-mono">{detailEvent.ipAddress}</span></div>
                <div><span className="text-gray-400">Field:</span> <code className="text-[#374151]">{detailEvent.field}</code></div>
                <div><span className="text-gray-400">Player:</span> <span className="text-[#374151]">{player.id}</span></div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-gray-400">Full JSON Payload</p>
                <div className="relative">
                  <pre className="bg-gray-50 border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all text-[#374151] max-h-[300px] overflow-y-auto">
                    {JSON.stringify(detailEvent, null, 2)}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 h-6 text-[10px] gap-1"
                    onClick={() => handleCopyJSON(detailEvent)}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
