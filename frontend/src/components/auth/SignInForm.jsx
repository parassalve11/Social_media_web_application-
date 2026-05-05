"use client";

import { useRef, useState } from "react";

import { Input } from "../UI/input";
import Button from "../UI/ButtonAnimatedGradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeClosed,
  Loader2,
  Lock,
  User2,
} from "lucide-react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { GoogleLogin } from "@react-oauth/google";
import useFormValidation from "../../hooks/useFormValidation";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../store/user/useUser";


const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const queryClient = useQueryClient();
  const { setUser } = useUser();

  const { addToast } = useToast();

  const { values, errors, handleChange, validateForm, handleBlur, touched } = useFormValidation(
    "signin",
    { identifier: "", password: "" }
  );
  const { mutate: signInMutation, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/signin", data);
      return res;
    },
    onSuccess: (data) => {
      addToast(data?.data?.message || "Signed in successfully!", {
        type: "success",
        duration: 3000,
      });
      const authUser = data?.data?.user;
      if (authUser) {
        setUser(authUser);
        queryClient.setQueryData(["authUser"], authUser);
      }
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setError("");
      navigate("/");
    },
    onError: (error) => {
      const code = error.response?.data?.code;
      if (code === "EMAIL_NOT_VERIFIED") {
        addToast("Please verify your email to continue.", {
          type: "warning",
          duration: 4000,
        });
        const email =
          error.response?.data?.email || values.identifier?.trim();
        if (email) {
          localStorage.setItem("pending_verification_email", email);
          navigate(`/check-inbox?email=${encodeURIComponent(email)}&type=verify`);
        }
      } else if (error.response?.status === 423) {
        addToast("Account locked. Try again later.", {
          type: "error",
          duration: 4000,
        });
      } else {
        addToast(error.response?.data?.message || "Something went wrong", {
          type: "error",
          duration: 3000,
        });
      }
      setError(error.response?.data?.message || error.message);
      console.log(error);
    },
  });
  const { mutate: googleAuthMutation } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/google-auth", data);
      return res.data;
    },
    onSuccess: (data) => {
      addToast("Signed In with Google successfully!", {
        type: "success",
        duration: 3000,
      });
      const authUser = data?.user;
      if (authUser) {
        setUser(authUser);
        queryClient.setQueryData(["authUser"], authUser);
      }
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
      if (!credentialResponse?.credential) {
        throw new Error("Missing Google credential");
      }

      googleAuthMutation({ credential: credentialResponse.credential });
    } catch (error) {
      addToast("Unable to sign in with Google.", {
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
   
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");
    const validation = validateForm();
    if (!validation.isValid) {
      if (validation.errors.identifier) identifierRef.current?.focus();
      else if (validation.errors.password) passwordRef.current?.focus();
      return;
    }
    signInMutation({
      identifier: values.identifier.trim(),
      password: values.password,
    });
    
  };

  return (
    <div>
      <p className="text-red-600 font-medium text-center text-xs mb-2">
        {error}
      </p>
      <form onSubmit={handleSignup}>
        <div className="space-y-5">
          <div>
            <label className="sr-only" htmlFor="signin-identifier">Email or username</label>
            <Input
              type="text"
              name="identifier"
              id="signin-identifier"
              value={values.identifier}
              placeholder="Email or username"
              className="w-full"
              onChange={handleChange}
              onBlur={handleBlur}
              leftIcon={<User2 />}
              required
              autoComplete="username"
              ref={identifierRef}
            />

           {touched.identifier && errors.identifier && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="sr-only" htmlFor="signin-password">Password</label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Your Password"
              className="w-full"
              name="password"
              id="signin-password"
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
              autoComplete="current-password"
              ref={passwordRef}
            />
            {touched.password && errors.password && (
              <p className="text-red-600 text-xs font-light mt-1">{errors.password}</p>
            )}
          </div>
        </div>
        <Link to={'/forgot-password'} className="flex items-center mt-auto">
          <p className="text-sm font-semibold text-blue-600 hover:cursor-pointer">Forget Password ?</p>
        </Link>
        <div className="space-y-3 mt-5">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#fff1ad] hover:bg-[#e6d89c]  text-black"
          >
            {isPending ? <Loader2 className="animate-spin size-4" /> : "Signin"}
          </Button>
        </div>
      </form>
      <div className="mt-4 text-center w-full mx-auto flex items-center flex-col animate-fade-in-up animation-delay-400">
        <p className="text-sm text-gray-600 mb-2">Or sign In with</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_blue"
          shape="pill"
          width="300"
          text="signIn_with"
        />
      </div>
    </div>
  );
};

export default SignInForm;
