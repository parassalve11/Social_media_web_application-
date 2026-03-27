"use client";

import SignInForm from "../../components/auth/SignInForm";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";

const SignInPage = () => {
  return (
    <AuthShell
      header={<AuthHeader subtitle="Join our community to connect, grow, and succeed." />}
      footer={<AuthFooter />}
    >
      <SignInForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign Up
          </a>
        </p>
      </div>
    </AuthShell>
  );
};

export default SignInPage;
