"use client";

import { useState } from "react";
import { Camera, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await updateProfile({ firstName, lastName, avatar });
      setMessage({ type: "ok", text: "Profile updated." });
    } catch {
      setMessage({ type: "error", text: "Unable to save your profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avatar</CardTitle>
            <CardDescription>
              A profile picture or URL. Leave the field empty to use your initials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-foreground">
                  {[firstName, lastName]
                    .filter(Boolean)
                    .map((name) => name![0])
                    .join("")
                    .toUpperCase() || user.email[0].toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
              </span>
            </span>
            <div className="flex-1">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your name. Your email is used for sign-in and can&apos;t be
              changed from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  minLength={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  minLength={2}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Used for sign-in and notifications.
              </p>
            </div>
          </CardContent>
        </Card>

        {message && (
          <p
            className={cn(
              "text-sm",
              message.type === "ok" ? "text-success" : "text-destructive"
            )}
            role="status"
          >
            {message.text}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            <Check className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
    </form>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your personal information and avatar.
        </p>
      </div>
      <ProfileForm key={user?.id} />
    </div>
  );
}