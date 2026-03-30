import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { useAdminAuthStore } from "@/stores/admin-auth.store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import logo from "../assets/logo.svg";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const forgotPassword = useAdminAuthStore((s) => s.forgotPassword);

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSentEmail(data.email);
      setEmailSent(true);
      setResendCooldown(60);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Unable to process your request. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    try {
      await forgotPassword(sentEmail);
      toast.success("Reset link resent.");
    } catch {
      toast.error("Unable to process your request. Please try again.");
    }
  };

  // View 1b: Email Sent Confirmation
  if (emailSent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
        <div className="w-full max-w-[440px] space-y-6">
          <Card className="border-[#E5E7EB] shadow-sm bg-white">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Check Your Email
                </h1>
                <p className="text-sm text-[#6B7280] max-w-sm">
                  If this email is registered, a reset link has been sent. The link expires in 15 minutes.
                </p>

                <div className="w-full pt-4 space-y-3">
                  <Link to="/login" className="block">
                    <Button className="w-full bg-[#003B95] hover:bg-[#003B95]/90">
                      Back to Login
                    </Button>
                  </Link>

                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="w-full text-sm font-medium text-[#003B95] hover:underline disabled:text-[#9CA3AF] disabled:no-underline"
                    aria-label="Resend password reset email"
                    aria-disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Didn't receive the email? Resend"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View 1: Forgot Password Form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <img src={logo} alt="Playzoon Admin" className="h-12 w-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Forgot Password
            </h1>
          </div>
        </div>

        <Card className="border-[#E5E7EB] shadow-sm bg-white">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Forgot password">
              <p className="text-sm text-[#6B7280]">
                Enter your registered email address. If an account exists, you will receive a password reset link.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#111827]">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  error={!!errors.email}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  disabled={isLoading}
                  className="bg-white"
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-[#EF4444]" role="alert" aria-live="assertive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-[#003B95] hover:bg-[#003B95]/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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
