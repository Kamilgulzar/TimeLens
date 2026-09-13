import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Monitor,
  Pause,
  Play,
  ExternalLink,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface TrackingSnapshot {
  isTracking: boolean;
  currentSession: {
    id: string;
    appName: string;
    title: string;
    windowId: number;
    startTime: number;
    accumulatedMs: number;
    lastPulseAt: number | null;
    category: string;
  } | null;
  todayTotalMs: number;
  todayByApp: Record<string, number>;
  pendingSync: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isTracking, setIsTracking] = useState(true);
  const [currentApp, setCurrentApp] = useState("No application detected");
  const [currentCategory, setCurrentCategory] = useState("");
  const [todayTotalMs, setTodayTotalMs] = useState(0);
  const [todayByApp, setTodayByApp] = useState<Record<string, number>>({});
  const [pendingSync, setPendingSync] = useState(0);

  const handleTrackingSnapshot = useCallback((snapshot: TrackingSnapshot) => {
    setIsTracking(snapshot.isTracking);
    setTodayTotalMs(snapshot.todayTotalMs);
    setTodayByApp(snapshot.todayByApp);
    setPendingSync(snapshot.pendingSync);

    if (snapshot.currentSession) {
      const app = snapshot.currentSession.appName;
      const category = snapshot.currentSession.category;
      const title = snapshot.currentSession.title;
      setCurrentApp(title ? `${app} - ${title}` : app);
      setCurrentCategory(category);
    } else {
      setCurrentApp("No application detected");
      setCurrentCategory("");
    }
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.getTrackingSnapshot().then((snapshot: TrackingSnapshot | null) => {
      if (snapshot) {
        handleTrackingSnapshot(snapshot);
      }
    });

    api.onTrackingSnapshot(handleTrackingSnapshot);

    return () => {
      api.removeTrackingSnapshotListener();
    };
  }, [handleTrackingSnapshot]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    api.onTrackingToggle((enabled: boolean) => {
      setIsTracking(enabled);
    });

    return () => {
      api.removeTrackingToggleListener();
    };
  }, []);

  function handleToggleTracking() {
    const api = window.electronAPI;
    if (api) {
      api.toggleTracking();
    } else {
      setIsTracking(!isTracking);
    }
  }

  async function handleLogout() {
    await logout();
  }

  function handleOpenDashboard() {
    window.open("https://timelens.app/dashboard", "_blank");
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const topApps = Object.entries(todayByApp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="flex h-[100dvh] flex-col bg-[#080A0F] overflow-hidden">
      {/* Title Bar */}
      <div className="drag-region flex h-10 shrink-0 items-center justify-between border-b border-[#161C26] px-4">
        <div className="no-drag flex items-center gap-2">
          <img src="/logo.png" alt="TimeLens" className="h-5 w-5 object-contain" />
          <span className="text-[13px] font-semibold text-[#F5F7FA]">TimeLens</span>
        </div>
        <div className="no-drag flex items-center gap-1.5">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              isTracking ? "bg-[#4ADE80] animate-pulse-dot" : "bg-[#6B7280]"
            }`}
          />
          <span className="text-[11px] text-[#8B919E]">
            {isTracking ? "Tracking" : "Paused"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* Today's Time */}
        <div className="text-center space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
            Today
          </p>
          <p className="text-[36px] font-bold tracking-[-0.03em] text-[#F5F7FA] leading-tight">
            {formatDuration(todayTotalMs)}
          </p>
          <p className="text-[12px] text-[#8B919E]">desktop time</p>
        </div>

        {/* Current Application */}
        <Card className="border-[#161C26] bg-[#0D1017] rounded-[16px]">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#6D5DF6]/10">
                <Monitor className="h-4 w-4 text-[#6D5DF6]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                  Current Application
                </p>
                <p className="truncate text-[13px] font-medium text-[#F5F7FA] mt-0.5">
                  {currentApp}
                </p>
                {currentCategory && (
                  <p className="text-[11px] text-[#8B919E] mt-0.5">
                    {currentCategory}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Apps */}
        {topApps.length > 0 && (
          <Card className="border-[#161C26] bg-[#0D1017] rounded-[16px]">
            <CardContent className="p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280] mb-2.5">
                Top Apps Today
              </p>
              <div className="space-y-2">
                {topApps.map(([app, ms]) => (
                  <div key={app} className="flex items-center justify-between">
                    <span className="truncate text-[12px] text-[#F5F7FA] max-w-[60%]">
                      {app}
                    </span>
                    <span className="text-[11px] text-[#8B919E]">
                      {formatDuration(ms)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Control */}
        <Button
          onClick={handleToggleTracking}
          variant={isTracking ? "outline" : "default"}
          className="w-full rounded-[12px] h-11 text-[14px] font-semibold"
        >
          {isTracking ? (
            <>
              <Pause className="h-4 w-4" />
              Pause Tracking
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Resume Tracking
            </>
          )}
        </Button>

        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#8B919E]">
            {pendingSync > 0 ? (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span className="text-[12px]">{pendingSync} pending sync</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="text-[12px]">Synced</span>
              </>
            )}
          </div>

          <button
            onClick={handleOpenDashboard}
            className="flex items-center gap-1 text-[12px] text-[#6D5DF6] hover:underline"
          >
            Dashboard
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#161C26] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6D5DF6]/10 text-[10px] font-semibold text-[#6D5DF6]">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <span className="truncate text-[12px] font-medium text-[#F5F7FA]">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8B919E] hover:text-[#F5F7FA]"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
