"use client";

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, ArrowLeft, Mail } from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import Button from "../../components/UI/ButtonAnimatedGradient";
import { Input } from "../../components/UI/input";
import { useToast } from "../../components/UI/ToastManager";
import { validateEmail } from "../../lib/validation";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("pending_verification_email") || "";
  });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const response = await axiosInstance.post("/auth/verify", { token });
        setStatus("success");
        setMessage(
          response?.data?.message || "Your email has been verified. You can now sign in."
        );
        localStorage.removeItem("pending_verification_email");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed.");
      }
    };

    verify();
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      return;
    }
    try {
      const response = await axiosInstance.post("/auth/resend-verification", {
        email: email.trim(),
      });
      const responseMessage =
        response?.data?.message || "Verification email sent.";
      addToast(responseMessage, { type: "success", duration: 3000 });
      setStatus("success");
      setMessage(responseMessage);
      setCooldown(60);
      localStorage.setItem("pending_verification_email", email.trim());
    } catch (error) {
      const responseMessage =
        error.response?.data?.message || "Unable to resend email.";
      addToast(responseMessage, {
        type: "error",
        duration: 3000,
      });
      setStatus("error");
      setMessage(responseMessage);
      if (error.response?.status === 429 && error.response?.data?.retryAfterSeconds) {
        setCooldown(error.response.data.retryAfterSeconds);
      }
    }
  };

  return (
    <AuthShell
      header={<AuthHeader subtitle="Verify your email to activate your account." />}
      footer={<AuthFooter />}
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link
            to="/signin"
            className="mt-1 p-2 rounded-xl bg-white/70 border border-white/80 shadow-sm hover:shadow transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm ring-4 ring-gray-100 flex items-center justify-center">
            {status === "success" ? (
              <CheckCircle2 className="text-green-600" size={24} />
            ) : (
              <AlertCircle className="text-amber-500" size={24} />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Email verification</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>

        {status === "success" ? (
          <Link to="/signin">
            <Button>Continue to sign in</Button>
          </Link>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <label className="text-sm font-medium text-gray-700" htmlFor="resend-email">
              Resend verification email
            </label>
            <p className="text-xs text-gray-500">
              We will tell you if this email exists in our database.
            </p>
            <Input
              id="resend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail />}
            />
            <Button type="submit" disabled={cooldown > 0}>
              {cooldown > 0 ? `Try again in ${cooldown}s` : "Resend email"}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
};

export default VerifyEmailPage;