"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="font-semibold text-lg">Pg Studio</span>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/auth/signin")}>
                  Sign In
                </Button>
                <Button onClick={() => router.push("/auth/signup")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Pg Studio"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Manage PostgreSQL databases with ease
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Connect, explore, and query your databases. View tables, preview
            data, and execute SQL—all from your browser.
          </p>
          <div className="flex gap-3 justify-center">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/auth/signup")}>
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/auth/signin")}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Pg Studio
      </footer>
    </div>
  );
}
