"use client";

import { Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Appearance</CardTitle>
        <CardDescription>
          Choose how TimeLens looks. This applies across the dashboard and settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid max-w-md grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] border px-4 py-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
              theme === "light"
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/60"
            )}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] border px-4 py-3 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
              theme === "dark"
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/60"
            )}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <AppearanceCard />
    </div>
  );
}