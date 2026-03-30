import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAdminAuthStore } from "@/stores/admin-auth.store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import logo from "../assets/logo.svg";

const resetSchema = z.object({
  newPassword: z.string().min(1, "Password is required"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm" role="listitem">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
      ) : (
        <XCircle className="h-4 w-4 text-[#EF4444] shrink-0" aria-hidden="true" />
      )}
      <span className={met ? "text-emerald-700" : "text-[#6B7280]"}>
        {label} {met ? "-- met" : "-- not met"}
      </span>
    </li>
  );
}

function getStrengthLevel(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return 0; // weak
  if (score <= 2) return 1; // fair
  if (score <= 3) return 2; // good
  return 3; // strong
}

const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-[#EF4444]", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(!token);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchedPassword = watch("newPassword");
  const watchedConfirm = watch("confirmPassword");

  const rules = useMemo(() => ({
    minLength: watchedPassword.length >= 8,
    lowercase: /[a-z]/.test(watchedPassword),
    uppercase: /[A-Z]/.test(watchedPassword),
    number: /[0-9]/.test(watchedPassword),
    special: /[^a-zA-Z0-9]/.test(watchedPassword),
  }), [watchedPassword]);

  const allRulesMet = rules.minLength && rules.lowercase && rules.uppercase && rules.number && rules.special;
  const passwordsMatch = watchedPassword.length > 0 && watchedConfirm.length > 0 && watchedPassword === watchedConfirm;
  const canSubmit = allRulesMet && passwordsMatch;

  const strengthLevel = getStrengthLevel(watchedPassword);

  const resetPassword = useAdminAuthStore((s) => s.resetPassword);

  const onSubmit = async (data: ResetFormValues) => {
    if (!canSubmit || !token) return;
    setIsLoading(true);
    try {
      await resetPassword(token, data.newPassword);
      toast.success("Your password has been reset successfully. Please log in.");
      navigate("/login");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Unable to process your request. Please try again.";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid token")) {
        setTokenExpired(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // View 2b: Expired Token State
  if (tokenExpired) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
        <div className="w-full max-w-[440px] space-y-6">
          <Card className="border-[#E5E7EB] shadow-sm bg-white">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Link Expired
                </h1>
                <p className="text-sm text-[#6B7280] max-w-sm">
                  This password reset link has expired or is invalid. Please request a new one.
                </p>

                <div className="w-full pt-4 space-y-3">
                  <Link to="/forgot-password" className="block">
                    <Button className="w-full bg-[#003B95] hover:bg-[#003B95]/90">
                      Request New Link
                    </Button>
                  </Link>
                  <div className="text-center">
                    <Link to="/login" className="text-sm font-medium text-[#003B95] hover:underline">
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View 2: Reset Password Form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <img src={logo} alt="Playzoon Admin" className="h-12 w-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Reset Password
            </h1>
          </div>
        </div>

        <Card className="border-[#E5E7EB] shadow-sm bg-white">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Reset password">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[#111827]">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    error={!!errors.newPassword}
                    aria-required="true"
                    aria-invalid={!!errors.newPassword}
                    aria-describedby="password-rules"
                    autoComplete="new-password"
                    className="pr-10 bg-white"
                    {...register("newPassword")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] focus:outline-none"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    aria-pressed={showNewPassword}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {watchedPassword.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-1" role="progressbar" aria-valuenow={strengthLevel + 1} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= strengthLevel ? STRENGTH_COLORS[strengthLevel] : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#6B7280]">{STRENGTH_LABELS[strengthLevel]}</p>
                  </div>
                )}

                {/* Password Requirements Checklist */}
                <ul id="password-rules" className="space-y-1 pt-1" role="list">
                  <PasswordRule met={rules.minLength} label="At least 8 characters" />
                  <PasswordRule met={rules.lowercase} label="One lowercase letter" />
                  <PasswordRule met={rules.uppercase} label="One uppercase letter" />
                  <PasswordRule met={rules.number} label="One number" />
                  <PasswordRule met={rules.special} label="One special character" />
                </ul>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#111827]">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    error={!!errors.confirmPassword || (watchedConfirm.length > 0 && !passwordsMatch)}
                    aria-required="true"
                    aria-invalid={!!errors.confirmPassword || (watchedConfirm.length > 0 && !passwordsMatch)}
                    aria-describedby="confirm-status"
                    autoComplete="new-password"
                    className="pr-10 bg-white"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-status" className="text-xs text-[#EF4444]" role="alert">{errors.confirmPassword.message}</p>
                )}
                {!errors.confirmPassword && watchedConfirm.length > 0 && (
                  passwordsMatch ? (
                    <p id="confirm-status" className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </p>
                  ) : (
                    <p id="confirm-status" className="text-xs text-[#EF4444]" role="alert">Passwords do not match.</p>
                  )
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#003B95] hover:bg-[#003B95]/90"
                disabled={!canSubmit || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm font-medium text-[#003B95] hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
