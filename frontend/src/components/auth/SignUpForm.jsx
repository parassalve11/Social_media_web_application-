"use client";

import { useRef, useState } from "react";

import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import toast from "react-hot-toast";
import { Eye, EyeClosed, Loader2, Lock, Mail, User2, UserCheck2 } from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { jwtDecode } from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";
import useFormValidation from "../../hooks/useFormValidation";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { useNavigate } from "react-router-dom";

const SignUpForm = () => {
  const { values, errors, handleChange, validateForm, handleBlur, touched } = useFormValidation(
    "signup",
    { name: "", username: "", email: "", password: "" }
  );

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const { addToast } = useToast();
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const queryClient = useQueryClient();

  const goToVerificationInbox = (email) => {
    const normalizedEmail = email?.trim();
    if (!normalizedEmail) return;
    localStorage.setItem("pending_verification_email", normalizedEmail);
    navigate(`/check-inbox?email=${encodeURIComponent(normalizedEmail)}&type=verify`);
  };

  const { mutate: signUpMutation, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/signup", data);
      return res;
    },
    onSuccess: (response) => {
      const responseCode = response?.data?.code;
      const message =
        response?.data?.message || "Check your email to verify your account.";
      addToast(message, {
        type:
          responseCode === "EMAIL_ALREADY_EXISTS_UNVERIFIED" ||
          responseCode === "VERIFICATION_EMAIL_QUEUED"
            ? "warning"
            : "success",
        duration: 4000,
      });
      setError("");
      goToVerificationInbox(response?.data?.email || values.email);
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Something went wrong";
      addToast(message, {
        type: "error",
        duration: 3000,
      });
      setError(message);
    },
  });

  const { mutate: googleAuthMutation } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/google-auth", data);
      return res.data;
    },
    onSuccess: () => {
      addToast("Signed up with Google successfully!", {
        type: "success",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setError("");
      navigate("/");
    },
    onError: (error) => {
      addToast(error.response?.data?.message || "Something went wrong", {
        type: "error",
        duration: 3000,
      });
      setError(error.response?.data?.message || error.message);
      console.error(error);
    },
  });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { name, email, sub: googleId } = decoded;

      googleAuthMutation({ name, email, googleId });
    } catch (error) {
      addToast("Unable to sign up with Google.", {
        type: "error",
        duration: 3000,
      });
      console.error(error);
    }
  };

  const handleGoogleError = () => {
    addToast("Something went wrong", {
      type: "error",
      duration: 3000,
    });
    setError("Google signup failed");
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");
    const validation = validateForm();
    if (!validation.isValid) {
      const fields = ["name", "username", "email", "password"];
      const firstError = fields.find((field) => validation.errors[field]);
      if (firstError === "name") nameRef.current?.focus();
      if (firstError === "username") usernameRef.current?.focus();
      if (firstError === "email") emailRef.current?.focus();
      if (firstError === "password") passwordRef.current?.focus();
      return;
    }
    signUpMutation(values);
  };

  return (
   <div>
    <p className="text-red-600 font-medium text-xs text-center mb-2">{error}</p>
     <form onSubmit={handleSignup} aria-live="polite">
      <div className="space-y-5">
        <div>
          <label className="sr-only" htmlFor="signup-name">Full name</label>
          <Input
            type="text"
            name='name'
            id="signup-name"
            value={values.name}
            placeholder="Full name"
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full"
            leftIcon={<UserCheck2 />}
            required
            autoComplete="name"
            ref={nameRef}
          />
           {touched.name && errors.name && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.name}</p>
            )}
        </div>
        <div>
          <label className="sr-only" htmlFor="signup-username">Username</label>
          <Input
            type="text"
            name='username'
            id="signup-username"
            value={values.username}
            placeholder="Enter Your Username"
            className="w-full"
            onChange={handleChange}
            onBlur={handleBlur}
            leftIcon={<User2 />}
            required
            autoComplete="username"
            ref={usernameRef}
          />
           {touched.username && errors.username && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.username}</p>
            )}
        </div>
        <div>
          <label className="sr-only" htmlFor="signup-email">Email</label>
          <Input
            type="email"
            name='email'
            id="signup-email"
            value={values.email}
            placeholder="Enter Your Email"
            className="w-full"
            onChange={handleChange}
            onBlur={handleBlur}
            leftIcon={<Mail />}
            required
            autoComplete="email"
            ref={emailRef}
          />
           {touched.email && errors.email && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.email}</p>
            )}
        </div>
        <div>
          <label className="sr-only" htmlFor="signup-password">Password</label>
          <Input
          name='password'
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
            className="w-full"
            onChange={handleChange}
            value={values.password}
            onBlur={handleBlur}
            leftIcon={<Lock />}
            rightIcon={
              showPassword ? (
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hide password">
                  <Eye />
                </button>
              ) : (
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show password">
                  <EyeClosed />
                </button>
              )
            }
            required
            autoComplete="new-password"
            ref={passwordRef}
          />
           {touched.password && errors.password && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.password}</p>
            )}
          <PasswordStrengthMeter password={values.password} />
        </div>
      </div>
      <div className="space-y-3 mt-5">
        
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#fff1ad] hover:bg-[#e6d89c]  text-black"
        >
          {isPending ? <Loader2 className="animate-spin size-4" /> : "Signup"}
        </Button>
      </div>
    </form>
     <div className="mt-4 text-center w-full mx-auto flex items-center flex-col animate-fade-in-up animation-delay-400">
        <p className="text-sm text-gray-600 mb-2">Or sign up with</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          shape="pill"
          width="300"
          text="signup_with"
        />
      </div>
   </div>
  );
};

export default SignUpForm;
