"use client";

// VerifyOtp.jsx
"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import OtpVerification from "../UI/OtpVerification";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../UI/ToastManager";
import axiosInstance from "../../lib/axiosIntance";

function VerifyOtp() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { email } = useParams();
  const otpVerificationRef = useRef(null);
  const { addToast } = useToast();

  const { mutate: verifyOtpMutation, isPending: verifyOtpLoading } = useMutation({
    mutationFn: async ({ otp, email }) =>
      await axiosInstance.post(`/auth/forget-password/${email}`, { otp, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: "authUser" });
      addToast("OTP verified successfully", {
        type: "success",
        duration: 3000,
      });
      setError("");
      navigate(`/forget-password/${email}/reset`); // Redirect to reset password page
    },
    onError: (error) => {
      addToast("Invalid OTP or OTP expired", {
        type: "error",
        duration: 3000,
      });
      setError(error.response?.data?.message || "Verification failed");
    },
  });

  const { mutate: conformEmailMutation, isPending: conformEmailLoading } = useMutation({
    mutationFn: async (email) =>
      await axiosInstance.post(`/auth/forget-password/check`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: "authUser" });
      addToast("OTP sent to email", {
        type: "success",
        duration: 3000,
      });
      setError("");
      navigate(`/verify/${email}`);
    },
    onError: (error) => {
      addToast("Email not found", {
        type: "error",
        duration: 3000,
      });
      setError(error.response?.data?.message || "Failed to resend OTP");
    },
  });

  const handleSubmit = async (otp, email) => {
    try {
      const { data } = verifyOtpMutation({ otp, email }, { throwOnError: true });
      return { success: true, message: data.message || "OTP verified successfully" };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Verification failed" };
    }
  };

  const handleResend = async (email) => {
    try {
      const { data } =  conformEmailMutation(email, { throwOnError: true });
      return { success: true, message: data.message || "OTP sent to email" };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Failed to resend OTP" };
    }
  };

  return (
    <div className="min-h-96 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className=" rounded-2xl border border-gray-700 p-8">
          <div className="text-center mb-8 relative">
            <button
              className="absolute top-0 left-0 p-2 bg-gray-200 rounded-2xl "
              onClick={() => navigate("/forget-password/check")}
            >
              <ArrowLeft />
            </button>
            <div className="w-20 h-20 bg-blue-700 mx-auto rounded-lg flex items-center justify-center mb-6">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3">Verify your Email</h1>
            <p className="">We have sent a 6-digit code to your email</p>
            <p className="font-medium text-blue-600 underline">{email}</p>
          </div>
          <div className="space-y-6">
            <label className="block  text-sm font-medium mb-2 text-center">
              Enter your 6-digit OTP
            </label>
            <OtpVerification
              ref={otpVerificationRef}
              length={6}
              email={email}
              onSubmit={handleSubmit}
              onResend={handleResend}
              autoFocus={true}
              className="justify-center"
              inputClassName="text-black"
              disabled={verifyOtpLoading || conformEmailLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
