"use client";

import ConformEmailForm from "../../components/forget-password/ConformEmailForm";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";

const ForgotPasswordPage = () => {
  return (
    <AuthShell
      header={<AuthHeader subtitle="Recover your account in a few steps." />}
      footer={<AuthFooter />}
    >
      <ConformEmailForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remembered your password?{" "}
          <a
            href="/signin"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign In
          </a>
        </p>
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
