"use client";

import ResetPasswordForm from "../../components/forget-password/ResetPasswordForm";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";

const ResetPasswordPage = () => {
  return (
    <AuthShell
      header={<AuthHeader subtitle="Create a new password to secure your account." />}
      footer={<AuthFooter />}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
};

export default ResetPasswordPage;
