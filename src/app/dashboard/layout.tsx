"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending, error } = authClient.useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push(`/auth/signin?redirect=${window.location.pathname}`); // Redirect to sign in if not logged in
      return;
    }

    setTimeout(() => {
      setIsAuthorized(true);
    }, 0);
  }, [session, isPending, router]);

  if (isPending || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return <> {children} </>;
}
