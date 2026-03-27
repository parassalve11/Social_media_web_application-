"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { Input } from "../../components/UI/input";
import Button from "../../components/UI/ButtonAnimatedGradient";
import { useToast } from "../../components/UI/ToastManager";
import { validateEmail } from "../../lib/validation";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";

const getStoredEmail = (type) =>
  typeof window === "undefined"
    ? ""
    : type === "reset"
      ? localStorage.getItem("pending_reset_email")
      : localStorage.getItem("pending_verification_email");

const CheckInboxPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const type = searchParams.get("type") || "verify";
  const queryEmail = searchParams.get("email");
  const [email, setEmail] = useState(queryEmail || getStoredEmail(type) || "");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const resendMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = type === "reset" ? "/auth/forgot" : "/auth/resend-verification";
      return axiosInstance.post(endpoint, payload);
    },
    onSuccess: (response) => {
      const message =
        response?.data?.message || "Email sent. Please check your inbox.";
      addToast(message, {
        type: "success",
        duration: 3000,
      });
      const key =
        type === "reset"
          ? "pending_reset_email"
          : "pending_verification_email";
      localStorage.setItem(key, email.trim());
      setCooldown(60);
      setError("");
    },
    onError: (err) => {
      addToast(err.response?.data?.message || "Unable to resend email.", {
        type: "error",
        duration: 3000,
      });
      if (err.response?.status === 429 && err.response?.data?.retryAfterSeconds) {
        setCooldown(err.response.data.retryAfterSeconds);
      }
      setError(err.response?.data?.message || "Unable to resend email.");
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const description = useMemo(() => {
    if (type === "reset") {
      return "If this email exists in our database, we'll send a reset link so you can choose a new password.";
    }
    return "We sent a verification link to your email. Follow the link to activate your account.";
  }, [type]);

  const handleResend = (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    resendMutation.mutate({ email: email.trim() });
  };

  return (
    <AuthShell
      header={<AuthHeader subtitle="We sent you a secure link to continue." />}
      footer={<AuthFooter />}
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link
            to={type === "reset" ? "/forgot-password" : "/signin"}
            className="mt-1 p-2 rounded-xl bg-white/70 border border-white/80 shadow-sm hover:shadow transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm ring-4 ring-blue-100">
            <Mail size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Check your inbox</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label htmlFor="check-email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="check-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-1"
              leftIcon={<Mail />}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>

          <Button type="submit" disabled={cooldown > 0 || resendMutation.isPending}>
            {cooldown > 0 ? (
              `Resend available in ${cooldown}s`
            ) : (
              <span className="flex items-center justify-center gap-2 text-sm">
                Resend email <RefreshCw size={16} />
              </span>
            )}
          </Button>
        </form>

        <div className="text-xs text-gray-500">
          Didn't get the email? Check spam or try another address.
        </div>
      </div>
    </AuthShell>
  );
};

export default CheckInboxPage;