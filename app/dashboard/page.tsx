"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectionsList } from "@/components/connections-list";
import { StudioView } from "@/components/studio";
import { useStudioNavigation } from "@/lib/use-studio-navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Connection } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useStudioNavigation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/auth/signin");
          return;
        }
        const user = await response.json();
        setUserId(user.id);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth/signin");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      toast.success("Signed out successfully");
      router.push("/auth/signin");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleSelectConnection = (connection: Connection) => {
    navigation.selectConnection(connection._id, connection.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  if (navigation.connectionId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigation.navigateToConnections()}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <Image src="/logo.png" alt="Logo" width={28} height={28} />
                <span className="font-semibold text-lg tracking-tight">
                  Pg Studio
                </span>
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <StudioView userId={userId} navigation={navigation} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="font-semibold text-lg tracking-tight">
              Pg Studio
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <ConnectionsList
            userId={userId}
            onSelectConnection={handleSelectConnection}
            selectedConnectionId={navigation.connectionId}
          />
        </div>
      </main>
    </div>
  );
}
