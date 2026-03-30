import { useState, useRef } from "react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  Eye, EyeOff, Save, Upload, Shield, Smartphone, Mail,
  Monitor, Laptop, Tablet, Globe, LogOut, X, Check,
  AlertTriangle, RefreshCw, Lock, CheckCircle2, Info,
  MapPin, Clock, KeyRound,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import api from "../../../../lib/api";
import ImageCropper from "../../ImageCropper";
import { CROP_PRESETS } from "../../../../lib/cropPresets";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";

// ─── Mock profile ─────────────────────────────────────────────

interface AdminProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
  twoFactorMethod: "totp" | "sms";
  smsPhone: string;
}

// ─── Mock sessions ────────────────────────────────────────────

interface Session {
  id: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
}

const INITIAL_PROFILE: AdminProfile = {
  displayName: "Super Admin",
  email:       "admin@playzoon.com",
  twoFactorMethod: "totp",
  smsPhone: "+971-50-000-0000",
};

const BASE = new Date(2026, 1, 21, 14, 0, 0);
const ago  = (h: number) => new Date(BASE.getTime() - h * 3_600_000);

const INITIAL_SESSIONS: Session[] = [
  { id: "s1", deviceType: "desktop", browser: "Chrome 122",  os: "macOS 15.2",   ip: "81.22.44.10",   location: "Dubai, UAE",   lastActive: ago(0.1),  isCurrent: true  },
  { id: "s2", deviceType: "mobile",  browser: "Safari 17",   os: "iOS 19.1",     ip: "185.44.22.88",  location: "Abu Dhabi, UAE", lastActive: ago(2),  isCurrent: false },
  { id: "s3", deviceType: "desktop", browser: "Firefox 124", os: "Windows 11",   ip: "94.13.77.55",   location: "Dubai, UAE",   lastActive: ago(8),  isCurrent: false },
  { id: "s4", deviceType: "tablet",  browser: "Chrome 122",  os: "iPadOS 17.4",  ip: "80.211.33.12",  location: "London, UK",   lastActive: ago(48), isCurrent: false },
];

// ─── Password strength ────────────────────────────────────────

interface StrengthCheck { label: string; pass: boolean }
function getStrengthChecks(pw: string, current: string): StrengthCheck[] {
  const diffCount = pw.split("").filter((c, i) => !current.includes(c)).length;
  return [
    { label: "At least 10 characters",                 pass: pw.length >= 10 },
    { label: "Uppercase letter (A–Z)",                  pass: /[A-Z]/.test(pw) },
    { label: "Lowercase letter (a–z)",                  pass: /[a-z]/.test(pw) },
    { label: "Number (0–9)",                            pass: /[0-9]/.test(pw) },
    { label: "Special character (!@#$%^&*…)",           pass: /[^A-Za-z0-9]/.test(pw) },
    { label: "Differs from current password (≥ 4 chars)", pass: diffCount >= 4 || pw !== current },
  ];
}

// ─── OTP input component ──────────────────────────────────────

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const next = digits.map((d, j) => j === i ? "" : d).join("").trimEnd();
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, j) => j === i ? digit : d).join("").replace(/\s/g, "");
    onChange(next);
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-12 text-center text-xl font-semibold border-2 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
        />
      ))}
    </div>
  );
}

// ─── Password input ───────────────────────────────────────────

function PasswordInput({ id, value, onChange, placeholder, label, autoComplete }: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; label: string; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete} className="pr-10" />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────

function Section({ icon: Icon, title, desc, children, color = "text-blue-600 bg-blue-50" }: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode; color?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Device icon ──────────────────────────────────────────────

function DeviceIcon({ type }: { type: Session["deviceType"] }) {
  if (type === "mobile")  return <Smartphone className="w-5 h-5 text-gray-500" />;
  if (type === "tablet")  return <Tablet      className="w-5 h-5 text-gray-500" />;
  return                         <Laptop      className="w-5 h-5 text-gray-500" />;
}

// ─── Main component ───────────────────────────────────────────

export function AdminAccountSettings() {
  const [profile,  setProfile]  = useState<AdminProfile>(INITIAL_PROFILE);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Profile ──────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  // ── Image cropper state ─────────────────────────────────
  const [cropRawSrc, setCropRawSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCropRawSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAvatarCropComplete = (_blob: Blob, previewUrl: string) => {
    setAvatarPreview(previewUrl);
  };

  const saveProfile = () => {
    if (!displayName.trim()) { toast.error("Display name cannot be empty."); return; }
    if (displayName.length > 60) { toast.error("Display name cannot exceed 60 characters."); return; }
    setProfile((p) => ({ ...p, displayName: displayName.trim() }));
    toast.success("Profile updated. Your display name will appear in audit logs and sub-admin views.");
  };

  // ── Password (BR-127-05) ─────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwAttempts, setPwAttempts] = useState(0);
  const [pwLocked,   setPwLocked]   = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);

  const MOCK_CURRENT_PW = "Admin@2026!";

  const strengthChecks = getStrengthChecks(newPw, currentPw);
  const allStrengthPass = strengthChecks.every((c) => c.pass);
  const pwMatch = newPw === confirmPw && confirmPw.length > 0;

  const handlePasswordChange = async () => {
    if (pwLocked) { toast.error("Password change is locked for 30 minutes due to too many failed attempts."); return; }
    if (!allStrengthPass || !pwMatch) return;

    setPwLoading(true);
    try {
      await api.post('/admin/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
        confirm_password: confirmPw,
      });
      setPwAttempts(0);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password changed successfully. A security notification has been sent to your email.");
    } catch (error: any) {
      const code = error?.response?.data?.error?.code;
      const msg = error?.response?.data?.message || "Failed to change password.";
      if (code === 'UNAUTHORIZED' || msg.toLowerCase().includes('incorrect')) {
        const attempts = pwAttempts + 1;
        setPwAttempts(attempts);
        if (attempts >= 3) {
          setPwLocked(true);
          toast.error("Too many incorrect attempts. Password change locked for 30 minutes (BR-127-05).");
        } else {
          toast.error(`Incorrect current password. ${3 - attempts} attempt${3 - attempts !== 1 ? "s" : ""} remaining.`);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setPwLoading(false);
    }
  };

  // ── Email (BR-127-04) ─────────────────────────────────────
  const [newEmail,     setNewEmail]    = useState("");
  const [otpSent,      setOtpSent]     = useState(false);
  const [otp,          setOtp]         = useState("");
  const [otpAttempts,  setOtpAttempts] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [otpLoading,   setOtpLoading]  = useState(false);
  const MOCK_OTP = "123456";

  const sendOtp = async () => {
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { toast.error("Please enter a valid email address."); return; }
    setEmailLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setEmailLoading(false);
    setOtpSent(true);
    setOtp("");
    setOtpAttempts(0);
    toast.success(`OTP sent to ${newEmail}. It expires in 10 minutes.`);
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { toast.error("Please enter the complete 6-digit OTP."); return; }
    setOtpLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setOtpLoading(false);

    if (otp !== MOCK_OTP) {
      const attempts = otpAttempts + 1;
      setOtpAttempts(attempts);
      if (attempts >= 3) {
        toast.error("Maximum OTP attempts reached. Please restart the email change process.");
        setOtpSent(false); setNewEmail(""); setOtp(""); setOtpAttempts(0);
      } else {
        toast.error(`Incorrect OTP. ${3 - attempts} attempt${3 - attempts !== 1 ? "s" : ""} remaining.`);
      }
      return;
    }

    setProfile((p) => ({ ...p, email: newEmail }));
    setNewEmail(""); setOtpSent(false); setOtp(""); setOtpAttempts(0);
    toast.success(`Email successfully changed to ${newEmail}.`);
  };

  // ── 2FA (BR-127-03) ──────────────────────────────────────
  const [twoFaMethod,  setTwoFaMethod]  = useState<"totp" | "sms">(profile.twoFactorMethod);
  const [pendingMethod, setPendingMethod] = useState<"totp" | "sms" | null>(null);
  const [verifyCode,    setVerifyCode]   = useState("");
  const [twoFaDialogOpen, setTwoFaDialogOpen] = useState(false);
  const [twoFaLoading,    setTwoFaLoading]    = useState(false);

  const requestTwoFaSwitch = (method: "totp" | "sms") => {
    if (method === twoFaMethod) return;
    setPendingMethod(method);
    setVerifyCode("");
    setTwoFaDialogOpen(true);
  };

  const confirmTwoFaSwitch = async () => {
    if (verifyCode.length < 6) { toast.error("Enter your current 6-digit verification code."); return; }
    setTwoFaLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTwoFaLoading(false);
    setTwoFaMethod(pendingMethod!);
    setProfile((p) => ({ ...p, twoFactorMethod: pendingMethod! }));
    setTwoFaDialogOpen(false);
    setPendingMethod(null);
    setVerifyCode("");
    toast.success(`2FA method switched to ${pendingMethod === "totp" ? "Authenticator App" : "SMS"}. Please set up your new method.`);
  };

  // ── Sessions (BR-127-06/07) ───────────────────────────────
  const [logoutAllConfirmOpen, setLogoutAllConfirmOpen] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const terminateSession = async (id: string) => {
    const sess = sessions.find((s) => s.id === id);
    if (sess?.isCurrent) return; // BR-127-07
    setTerminatingId(id);
    await new Promise((r) => setTimeout(r, 600));
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setTerminatingId(null);
    toast.success("Session terminated.");
  };

  const logoutAllDevices = async () => {
    setLogoutAllConfirmOpen(false);
    await new Promise((r) => setTimeout(r, 800));
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success("All other sessions terminated (BR-127-06). Your current session remains active.");
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile, security credentials, and active sessions.</p>
      </div>

      {/* ── 1. Profile ──────────────────────────────────────── */}
      <Section icon={Upload} title="Admin Profile" desc="Display name and photo shown in audit logs and sub-admin views."
        color="text-violet-600 bg-violet-50">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden bg-[#003B95]/10 flex items-center justify-center text-[#003B95] text-2xl font-bold select-none">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : displayName.charAt(0).toUpperCase()}
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Upload className="w-3 h-3" /> Upload photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} className="hidden" />
            <p className="text-[10px] text-gray-400">JPG / PNG · max 2 MB</p>
          </div>

          {/* Name */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value.slice(0, 60))} maxLength={60} />
              <p className={cn("text-[10px]", displayName.length > 50 ? "text-amber-500" : "text-gray-400")}>
                {displayName.length} / 60 characters
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Current Email</Label>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{profile.email}</p>
              <p className="text-xs text-gray-400">To change email, use the Email Address section below.</p>
            </div>
            <Button onClick={saveProfile} className="gap-2 bg-[#003B95] hover:bg-[#002a6b]" size="sm">
              <Save className="w-3.5 h-3.5" /> Save Profile
            </Button>
          </div>
        </div>
      </Section>

      {/* ── 2. Change Password ──────────────────────────────── */}
      <Section icon={KeyRound} title="Change Password" desc="Minimum 10 characters with uppercase, lowercase, number, and special character."
        color="text-blue-600 bg-blue-50">
        {pwLocked && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Password change locked</p>
              <p className="text-xs mt-0.5">Too many failed attempts. Password change is locked for 30 minutes (BR-127-05).</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <PasswordInput id="currentPw" label="Current Password" value={currentPw} onChange={setCurrentPw}
              placeholder="Enter current password" autoComplete="current-password" />
            <PasswordInput id="newPw" label="New Password" value={newPw} onChange={setNewPw}
              placeholder="Enter new password" autoComplete="new-password" />
            <PasswordInput id="confirmPw" label="Confirm New Password" value={confirmPw} onChange={setConfirmPw}
              placeholder="Repeat new password" autoComplete="new-password" />

            {confirmPw && !pwMatch && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={pwLoading || pwLocked || !allStrengthPass || !pwMatch || !currentPw}
              className="w-full gap-2 bg-[#003B95] hover:bg-[#002a6b]">
              {pwLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Changing…</>
                : <><KeyRound className="w-4 h-4" /> Change Password</>}
            </Button>

            {/* Hint */}
            <p className="text-[10px] text-gray-400">
              Hint: Try "Admin@2026!" as the mock current password.
            </p>
          </div>

          {/* Strength checks */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Password Requirements</p>
            {strengthChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                  check.pass ? "bg-emerald-500" : "bg-gray-200")}>
                  {check.pass && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={cn("text-xs", check.pass ? "text-emerald-700 font-medium" : "text-gray-400")}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 3. Change Email (BR-127-04) ─────────────────────── */}
      <Section icon={Mail} title="Change Email Address"
        desc="Requires OTP verification to the new email. Old email remains active until OTP is confirmed (BR-127-04)."
        color="text-emerald-600 bg-emerald-50">

        <div className="max-w-md space-y-4">
          {!otpSent ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com" />
              </div>
              <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                An OTP will be sent to the new email. The change is not applied until the OTP is verified.
              </div>
              <Button onClick={sendOtp} disabled={emailLoading || !newEmail} className="gap-2 bg-[#003B95] hover:bg-[#002a6b]">
                {emailLoading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  : <><Mail className="w-4 h-4" /> Send OTP to New Email</>}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                OTP sent to <strong>{newEmail}</strong>. It expires in 10 minutes. (Mock OTP: <strong>123456</strong>)
              </div>

              <div className="space-y-2">
                <Label>Enter 6-digit OTP</Label>
                <OTPInput value={otp} onChange={setOtp} />
                {otpAttempts > 0 && (
                  <p className="text-xs text-red-500">{3 - otpAttempts} attempt{3 - otpAttempts !== 1 ? "s" : ""} remaining.</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={verifyOtp} disabled={otpLoading || otp.length < 6} className="gap-2 bg-[#003B95] hover:bg-[#002a6b]">
                  {otpLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Verify OTP</>}
                </Button>
                <button onClick={() => { setOtpSent(false); setOtp(""); setOtpAttempts(0); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Use different email
                </button>
                <button onClick={sendOtp} className="text-xs text-blue-600 hover:underline">Resend OTP</button>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── 4. Two-Factor Authentication (BR-127-03) ─────────── */}
      <Section icon={Shield} title="Two-Factor Authentication (2FA)"
        desc="2FA is mandatory for Admin accounts. You can switch between methods but cannot disable it (BR-127-03)."
        color="text-red-600 bg-red-50">

        <div className="space-y-4">
          {/* Cannot disable notice */}
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Two-Factor Authentication is mandatory for Admin accounts and cannot be disabled.</p>
              <p className="text-xs mt-0.5 text-red-700">You may switch between methods by verifying your current 2FA code first.</p>
            </div>
          </div>

          {/* Method selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* TOTP */}
            <button onClick={() => requestTwoFaSwitch("totp")}
              className={cn("flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                twoFaMethod === "totp"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300 bg-white")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                twoFaMethod === "totp" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">Authenticator App (TOTP)</p>
                  {twoFaMethod === "totp" && <Badge className="text-[10px] bg-blue-600 text-white">Active</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Use Google Authenticator, Authy, or similar TOTP apps.</p>
              </div>
            </button>

            {/* SMS */}
            <button onClick={() => requestTwoFaSwitch("sms")}
              className={cn("flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                twoFaMethod === "sms"
                  ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300 bg-white")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                twoFaMethod === "sms" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">SMS (Mobile Number)</p>
                  {twoFaMethod === "sms" && <Badge className="text-[10px] bg-blue-600 text-white">Active</Badge>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Receive a 6-digit code via SMS to {profile.smsPhone}.</p>
              </div>
            </button>
          </div>
        </div>
      </Section>

      {/* ── 5. Active Sessions (BR-127-06/07) ───────────────── */}
      <Section icon={Monitor} title="Active Sessions"
        desc="All devices currently logged in to your Admin account. Terminate any suspicious sessions immediately."
        color="text-slate-600 bg-slate-100">

        <div className="space-y-4">
          {/* BR banners */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
              <Info className="w-3 h-3" /> BR-127-07: Cannot terminate current session from this view
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> BR-127-06: Log Out All Devices keeps current session active
            </span>
          </div>

          {/* Session table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Device / Browser</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">IP Address</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Active</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr key={session.id}
                    className={cn("hover:bg-gray-50/50 transition-colors", session.isCurrent && "bg-blue-50/30")}>
                    {/* Device */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <DeviceIcon type={session.deviceType} />
                        <div>
                          <p className="font-medium text-gray-900">{session.browser} · {session.os}</p>
                          {session.isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full mt-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Current Session
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* IP */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-gray-600">{session.ip}</span>
                    </td>
                    {/* Location */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />{session.location}
                      </span>
                    </td>
                    {/* Last Active */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{session.isCurrent ? "Now" : formatDistanceToNow(session.lastActive, { addSuffix: true })}</p>
                      <p className="text-[10px] text-gray-400">{format(session.lastActive, "dd MMM yyyy HH:mm")}</p>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3 text-center">
                      {session.isCurrent ? (
                        <span className="text-xs text-gray-400 italic">—</span>
                      ) : (
                        <button onClick={() => terminateSession(session.id)}
                          disabled={terminatingId === session.id}
                          className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium disabled:opacity-50 flex items-center gap-1 mx-auto">
                          {terminatingId === session.id
                            ? <><div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> Ending…</>
                            : <><X className="w-3 h-3" /> Terminate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Log Out All Devices */}
          {otherSessionsCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-red-800">
                  {otherSessionsCount} other active session{otherSessionsCount !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-600 mt-0.5">Terminate all sessions except this one. Your current session remains active.</p>
              </div>
              <Button onClick={() => setLogoutAllConfirmOpen(true)} variant="destructive" size="sm" className="gap-2 shrink-0">
                <LogOut className="w-3.5 h-3.5" /> Log Out All Devices
              </Button>
            </div>
          )}

          {otherSessionsCount === 0 && (
            <p className="text-xs text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> No other active sessions.
            </p>
          )}
        </div>
      </Section>

      {/* ── 2FA Switch Dialog (BR-127-03) ── */}
      <AlertDialog open={twoFaDialogOpen} onOpenChange={setTwoFaDialogOpen}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Verify Current 2FA to Switch Method
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-1">
                <p className="text-sm text-gray-600">
                  To switch to <strong>{pendingMethod === "totp" ? "Authenticator App (TOTP)" : "SMS"}</strong>, enter your current{" "}
                  <strong>{twoFaMethod === "totp" ? "TOTP code" : "SMS code"}</strong> to authorise the change (BR-127-03).
                </p>
                <div className="space-y-2">
                  <Label>Current {twoFaMethod === "totp" ? "Authenticator" : "SMS"} Code</Label>
                  <OTPInput value={verifyCode} onChange={setVerifyCode} />
                  <p className="text-[10px] text-gray-400">Enter any 6-digit code to proceed in mock mode.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setVerifyCode(""); setPendingMethod(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTwoFaSwitch} disabled={twoFaLoading || verifyCode.length < 6}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40">
              {twoFaLoading ? "Verifying…" : "Confirm Switch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Log Out All Devices Confirm (BR-127-06) ── */}
      <AlertDialog open={logoutAllConfirmOpen} onOpenChange={setLogoutAllConfirmOpen}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-600" /> Log Out All Other Devices?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600 mt-1">
                <p>This will immediately terminate <strong>{otherSessionsCount} other session{otherSessionsCount !== 1 ? "s" : ""}</strong>.</p>
                <ul className="space-y-1 pl-4">
                  {sessions.filter((s) => !s.isCurrent).map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <DeviceIcon type={s.deviceType} />
                      {s.browser} · {s.location}
                    </li>
                  ))}
                </ul>
                <p className="text-xs bg-blue-50 border border-blue-100 rounded p-2 text-blue-700">
                  BR-127-06: Your current session will remain active.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logoutAllDevices} className="bg-red-600 hover:bg-red-700">
              Log Out All Other Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Image Cropper ───────────────────────────────────── */}
      <ImageCropper
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropRawSrc}
        onCropComplete={handleAvatarCropComplete}
        {...CROP_PRESETS.profilePhoto}
      />
    </div>
  );
}
