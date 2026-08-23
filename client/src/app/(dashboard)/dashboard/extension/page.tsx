"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Download, Info, Pause, Play, Puzzle } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRelativeTime,
  requestExtensionDisconnect,
  setExtensionTracking,
} from "@/lib/extension";
import { useExtensionStatus } from "@/hooks/use-extension-status";
import { cn } from "@/lib/utils";

const EXTENSION_VERSION = "0.1.0";
const ZIP_PATH = "/extensions/timelens-extension.zip";

const steps = [
  {
    title: "Download TimeLens",
    body: "Download the latest extension ZIP and extract it somewhere you can find easily.",
  },
  {
    title: "Open your browser extensions",
    body: "For Chrome, open chrome://extensions. For Edge, open edge://extensions.",
  },
  {
    title: "Turn on Developer mode",
    body: "Enable Developer mode from the extensions page.",
  },
  {
    title: "Load the extension",
    body: "Click Load unpacked and select the extracted TimeLens extension folder.",
  },
  {
    title: "Pin TimeLens",
    body: "Pin the TimeLens extension to your browser toolbar so you can open it quickly.",
  },
  {
    title: "Start tracking",
    body: "Open TimeLens and make sure tracking is enabled.",
  },
  {
    title: "Check your dashboard",
    body: "Return to TimeLens and make sure the Extension section shows Connected. Your browsing activity should then begin appearing on the dashboard.",
  },
];

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
  );
}

function StatusDot({ active, color }: { active: boolean; color?: "success" | "muted" }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        color === "success" ? "bg-success" : active ? "bg-primary" : "bg-warning"
      )}
      aria-hidden
    />
  );
}

function ConnectedStatus() {
  const { data: status, refetch } = useExtensionStatus();
  const [pending, setPending] = useState<"none" | "toggle" | "disconnect">("none");

  const controlMutation = useMutation({
    mutationFn: (enabled: boolean) => setExtensionTracking(enabled),
    onMutate: () => setPending("toggle"),
    onSettled: () => {
      setPending("none");
      void refetch();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => requestExtensionDisconnect(),
    onMutate: () => setPending("disconnect"),
    onSettled: () => {
      setPending("none");
      void refetch();
    },
  });

  if (!status) return null;
  const tracking = status.trackingEnabled;
  const applying =
    pending === "toggle" ||
    (status.desiredTrackingEnabled !== null &&
      status.desiredTrackingEnabled !== tracking);
  const disconnectRequested = pending === "disconnect" || status.pendingAction === "disconnect";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Extension Status
        </CardTitle>
        <CardAction>
          <StatusDot active={status.connected} color="success" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          <StatusRow label="Extension">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Connected
            </span>
          </StatusRow>
          <StatusRow label="Tracking">
            <span className="flex items-center gap-2">
              <StatusDot active={tracking} />
              {applying ? "Applying…" : tracking ? "Active" : "Paused"}
            </span>
          </StatusRow>
          <StatusRow label="Browser">{status.browser}</StatusRow>
          <StatusRow label="Version">{status.version ?? EXTENSION_VERSION}</StatusRow>
          <StatusRow label="Last synced">
            {formatRelativeTime(status.lastSyncedAt)}
          </StatusRow>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={applying || pending !== "none"}
            onClick={() => controlMutation.mutate(!tracking)}
            className="flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {tracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {applying ? "Applying…" : tracking ? "Pause Tracking" : "Resume Tracking"}
          </button>
          <button
            type="button"
            disabled={pending !== "none"}
            onClick={() => disconnectMutation.mutate()}
            className="flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {disconnectRequested ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotConnectedStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Extension Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50" aria-hidden />
            <span className="text-sm font-medium text-foreground">Not connected</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect the TimeLens browser extension to start tracking your
            activity.
          </p>
          <div>
            <a
              href="#install"
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <Puzzle className="h-4 w-4" />
              Connect Extension
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DownloadCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Download</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">TimeLens Extension</span>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Version {EXTENSION_VERSION}
          </span>
        </div>
        <Link
          href={ZIP_PATH}
          download
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Download className="h-4 w-4" />
          Download extension (.zip)
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          Chrome 110+ and Chromium-based browsers
        </p>
      </CardContent>
    </Card>
  );
}

function InstallSection() {
  return (
    <Card id="install">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-foreground">
          Install the TimeLens extension
        </CardTitle>
        <CardDescription>
          The TimeLens extension isn&apos;t published in the Chrome Web Store yet.
          Install it manually using the steps below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span className="mt-1.5 w-px flex-1 bg-border" aria-hidden />
                )}
              </div>
              <div className={cn("min-w-0", i < steps.length - 1 ? "pb-6" : "pb-1")}>
                <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/40 px-3.5 py-3">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Privacy.</span>{" "}
            TimeLens records the website you&apos;re visiting and how long you spend there. It does
            not record passwords or page contents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExtensionPage() {
  const { data: status } = useExtensionStatus();
  const connected = Boolean(status?.connected);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Extension</h1>
        <p className="mt-1 text-muted-foreground">
          Connect the TimeLens browser extension, then control tracking from here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {connected ? <ConnectedStatus /> : <NotConnectedStatus />}
        </div>
        <div className="lg:col-span-1">
          <DownloadCard />
        </div>
      </div>

      <InstallSection />
    </div>
  );
}