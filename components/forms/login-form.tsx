"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginFormSchema,
  type LoginFormData,
} from "@/lib/validators/auth.validators";
import { useLogin } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/api";

// Map raw API error messages to user-friendly text
function getFriendlyError(error: unknown): string {
  const msg = getErrorMessage(error).toLowerCase();
  if (
    msg.includes("invalid credentials") ||
    msg.includes("unauthorized") ||
    msg.includes("invalid") ||
    msg.includes("password") ||
    msg.includes("not found")
  ) {
    return "Wrong email or password.";
  }
  return "Something went wrong. Please try again.";
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
      onError: (error) => {
        // Show inline form error instead of crashing Next.js
        setError("root", { message: getFriendlyError(error) });
      },
    });
  };

  const isPending = loginMutation.isPending;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-primary/20 shadow-lg backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-5">
          <CardTitle className="text-lg font-bold text-foreground tracking-tight">
            Agent Login
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-medium">
            Access your travel agency dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-5">
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-3 text-xs">
                  Travel Agent Portal
                </span>
              </div>
              {errors.root && (
                <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                  {errors.root.message}
                </div>
              )}
              <div className="grid gap-5 py-2">
                <div className="grid gap-3">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    className={cn(
                      "h-11 border-primary/20 focus:border-primary focus:ring-primary/20",
                      errors.email &&
                        "border-destructive focus:border-destructive",
                    )}
                    disabled={isPending}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <a
                      href="#"
                      className="ml-auto text-xs text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-11 border-primary/20 focus:border-primary focus:ring-primary/20 pr-10"
                      disabled={isPending}
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-tight shadow-md hover:shadow-lg transition-all duration-200 mt-2"
                >
                  {isPending ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground/70 text-center text-[10px] text-balance">
        Authorized travel agents only. Activities monitored.
      </div>
    </div>
  );
}
