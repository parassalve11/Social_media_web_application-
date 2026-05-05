"use client";

// OtpVerification.jsx
"use client";

import React, { useRef, useState, useEffect, forwardRef } from "react";
import { Loader2, ArrowRight } from "lucide-react";

const OtpVerification = forwardRef(
  (
    {
      length = 6,
      email,
      onSubmit,
      onResend,
      disabled = false,
      className = "",
      inputClassName = "",
      autoFocus = true,
      resendTimeout = 60,
    },
    ref
  ) => {
    const [otp, setOtp] = useState(Array(length).fill(""));
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(resendTimeout);
    const inputRefs = useRef([]);

    // Expose focus and clear methods
    React.useImperativeHandle(ref, () => ({
      focus: () => inputRefs.current[0]?.focus(),
      clear: () => {
        setOtp(Array(length).fill(""));
        inputRefs.current[0]?.focus();
        setError("");
      },
    }));

    // Auto-focus first input on mount if autoFocus is true
    useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [autoFocus]);

    // Timer for resend OTP
    useEffect(() => {
      if (timer > 0) {
        const interval = setInterval(() => {
          setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [timer]);

    const handleInputChange = (index, value) => {
      if (value.length > 1) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError(""); // Clear error on change

      if (value && index < length - 1) {
        inputRefs.current[index + 1].focus();
      }
    };

    const handleKeyDown = (index, e) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      const digits = pastedData.replace(/\D/g, "").slice(0, length);

      if (digits.length === length) {
        const newOtp = digits.split("");
        setOtp(newOtp);
        inputRefs.current[length - 1].focus();
        setError("");
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const otpString = otp.join("");
      if (otpString.length !== length) {
        setError(`Please enter all ${length} digits`);
        return;
      }

      setLoading(true);
      try {
        const result = await onSubmit(otpString, email);
        if (result.success) {
          setOtp(Array(length).fill(""));
          inputRefs.current[0]?.focus();
        } else {
          setError(result.message || "Verification failed");
        }
      } catch (err) {
        setError(err.message || "An error occurred during verification");
      } finally {
        setLoading(false);
      }
    };

    const handleResend = async () => {
      setResendLoading(true);
      try {
        const result = await onResend(email);
        if (result.success) {
          setTimer(resendTimeout);
          setOtp(Array(length).fill(""));
          setError("");
          inputRefs.current[0]?.focus();
        } else {
          setError(result.message || "Failed to resend OTP");
        }
      } catch (err) {
        setError(err.message || "An error occurred during resend");
      } finally {
        setResendLoading(false);
      }
    };

    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              value={digit}
              maxLength={1}
              type="text"
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={disabled || loading}
              className={`w-12 h-12 rounded-lg text-black border-2 ${
                error ? "border-red-600" : "border-gray-600"
              } text-center font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 ${inputClassName}`}
            />
          ))}
        </div>
        {error && <p className="text-center text-red-300 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="submit"
            disabled={loading || disabled}
            className="w-full bg-blue-600 hover:bg-blue-700 font-semibold text-white px-4 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>Verify</span>
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          </button>
        </form>
        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium">Didn’t receive the OTP?</p>
          {timer > 0 ? (
            <p className="text-gray-400 text-sm font-medium">Resend OTP in <span className="text-blue-500 font-semibold">{timer}</span> seconds</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading || disabled}
              className="text-blue-400 hover:text-blue-300 font-medium text-sm disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>
      </div>
    );
  }
);

OtpVerification.displayName = "OtpVerification";

export default OtpVerification;
