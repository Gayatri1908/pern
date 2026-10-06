"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // RBAC: Accounts are provisioned by Administrator
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
      <p className="text-sm">Redirecting to login...</p>
    </div>
  );
}
