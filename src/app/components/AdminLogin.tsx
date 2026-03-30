import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { useAdminAuthStore } from "@/stores/admin-auth.store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import logo from "../assets/logo.svg";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function AdminLogin() {
  const navigate = useNavigate();
  const login = useAdminAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await login(data.email, data.password);
      toast.success("Login successful", {
        description: "Redirecting to dashboard...",
      });
      navigate("/");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Invalid email or password.";
      setServerError(msg);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <img src={logo} alt="Playzoon Admin" className="h-12 w-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Admin Panel
            </h1>
          </div>
        </div>

        <Card className="border-[#E5E7EB] shadow-sm bg-white">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Admin login">

              {serverError && (
                <Alert variant="destructive" className="mb-2" role="alert" aria-live="assertive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#111827]">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#111827]">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    error={!!errors.password}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="pr-10 bg-white"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-[#EF4444]" role="alert" aria-live="assertive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end pt-2">
                <Link to="/forgot-password" className="text-sm font-medium text-[#003B95] hover:underline" aria-label="Forgot password? Reset your password">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" className="w-full bg-[#003B95] hover:bg-[#003B95]/90 mt-2" disabled={isLoading} aria-label={isLoading ? "Signing in..." : undefined}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
