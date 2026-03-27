"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../UI/ToastManager";
import {
  ArrowLeft,
  ChevronFirstIcon,
  Eye,
  EyeClosed,
  Loader2,
  Lock,
} from "lucide-react";
import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import PasswordStrengthMeter from "../auth/PasswordStrengthMeter";
import { validatePassword } from "../../lib/validation";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const redirectTimeoutRef = useRef(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const { mutate: resetPasswordMutation, isPending } = useMutation({
    mutationFn: async ({ token: resetToken, password: nextPassword }) =>
      axiosInstance.post("/auth/reset", {
        token: resetToken,
        newPassword: nextPassword,
      }),
    onSuccess: (response) => {
      const message =
        response?.data?.message || "Password changed successfully.";
      addToast(message, {
        type: "success",
        duration: 3000,
      });
      localStorage.removeItem("pending_reset_email");
      setError("");
      setSuccessMessage(`${message} Redirecting to sign in in 2 seconds...`);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate("/signin");
      }, 2000);
    },
    onError: (mutationError) => {
      const message =
        mutationError.response?.data?.message ||
        "Unable to change your password.";
      addToast(message, {
        type: "error",
        duration: 3000,
      });
      setSuccessMessage("");
      setError(message);
    },
  });

  const matchError = useMemo(() => {
    if (!token) return "Reset token missing or invalid.";
    if (confirmPassword && confirmPassword !== password) {
      return "Passwords do not match.";
    }
    return "";
  }, [password, confirmPassword, token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (matchError) {
      setError(matchError);
      return;
    }

    resetPasswordMutation({ token, password });
  };

  return (
    <div>
      <div className="relative rounded-2xl p-8">
        <div className="text-center relative">
          <h1 className="text-xl font-bold mb-3 md:text-4xl">
            Reset password
          </h1>
        </div>
        <Link to="/signin" className="absolute left-[-20px] top-0">
          <button type="button" className="p-2 rounded-lg bg-gray-100">
            <ArrowLeft size={20} />
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label className="sr-only" htmlFor="reset-password">
              New password
            </label>
            <Input
              name="password"
              id="reset-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              className="w-full"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              leftIcon={<Lock />}
              rightIcon={
                showPassword ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(false)}
                    aria-label="Hide password"
                  >
                    <Eye />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPassword(true)}
                    aria-label="Show password"
                  >
                    <EyeClosed />
                  </button>
                )
              }
              required
              autoComplete="new-password"
            />
          </div>

          <PasswordStrengthMeter password={password} />

          <div>
            <label className="sr-only" htmlFor="reset-confirm">
              Confirm password
            </label>
            <Input
              name="confirm-password"
              id="reset-confirm"
              type="password"
              placeholder="Confirm your password"
              className="w-full"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              leftIcon={<ChevronFirstIcon />}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="space-y-3 mt-5">
          <Button
            type="submit"
            disabled={isPending || !token}
            className="w-full bg-[#fff1ad] hover:bg-[#e6d89c] text-black"
          >
            {isPending ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <p className="text-sm flex items-center gap-2">Change password</p>
            )}
          </Button>
        </div>
      </form>

      {successMessage && (
        <p
          className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
          aria-live="polite"
        >
          {successMessage}
        </p>
      )}

      {(error || matchError) && !successMessage && (
        <p
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          aria-live="polite"
        >
          {error || matchError}
        </p>
      )}
    </div>
  );
}