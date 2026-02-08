import { Loader } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}
