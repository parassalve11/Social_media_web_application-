"use client";

import SignUpForm from "../../components/auth/SignUpForm";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";

const SignUpPage = () => {
  return (
    <AuthShell
      header={<AuthHeader subtitle="Join our community to connect, grow, and succeed." />}
      footer={<AuthFooter />}
    >
      <SignUpForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/signin"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Log in
          </a>
        </p>
      </div>
    </AuthShell>
  );
};

export default SignUpPage;
