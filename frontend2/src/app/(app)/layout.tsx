"use client";

import AuthGate from "@/components/auth/AuthGate";
import Layout from "@/components/layout/Layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <Layout>{children}</Layout>
    </AuthGate>
  );
}
