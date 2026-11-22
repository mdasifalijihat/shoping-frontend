"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  updateProfile,
  type CustomerProfile,
  type ProfileUpdate,
} from "@/app/services/profile.service";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { profileQuery } from "@/components/store/customer-query";
import { StoreError, StoreLoading } from "@/components/store/store-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

export default function ProfilePage() {
  const session = authClient.useSession();
  const options = profileQuery(session.data?.user.id);
  const query = useQuery(options);
  const cache = useQueryClient();

  if (query.isPending) return <StoreLoading rows={2} />;
  if (query.error)
    return (
      <StoreError
        message="We couldn't load your profile."
        retry={() => void query.refetch()}
      />
    );
  return (
    <ProfileForm
      key={`${query.data.id}/${query.data.updatedAt}`}
      profile={query.data}
      onSave={async (data) => {
        const saved = await updateProfile(data);
        cache.setQueryData(options.queryKey, saved);
        void session.refetch();
      }}
    />
  );
}

function ProfileForm({
  profile,
  onSave,
}: {
  profile: CustomerProfile;
  onSave: (data: ProfileUpdate) => Promise<void>;
}) {
  const [image, setImage] = useState(profile.image);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || uploading) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim() || null;
    const address = String(form.get("address") ?? "").trim() || null;
    if (!name) {
      toast.error("Enter your name.");
      return;
    }
    const data = {
      ...(name !== profile.name && { name }),
      ...(phone !== profile.phone && { phone }),
      ...(address !== profile.address && { address }),
      ...(image !== profile.image && { image }),
    };
    if (!Object.keys(data).length) {
      toast.info("No profile changes to save.");
      return;
    }
    lock.current = true;
    setPending(true);
    try {
      await onSave(data);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update your profile.",
      );
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="post" onSubmit={(event) => void submit(event)}>
          <fieldset
            disabled={pending}
            className="grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem]"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  name="name"
                  required
                  autoComplete="name"
                  defaultValue={profile.name}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  readOnly
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  defaultValue={profile.phone ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-address">Address</Label>
                <Textarea
                  id="profile-address"
                  name="address"
                  autoComplete="street-address"
                  defaultValue={profile.address ?? ""}
                />
              </div>
            </div>
            <div role="group" aria-label="Profile image" className="space-y-2">
              <p className="text-sm font-medium">Profile image</p>
              <ImageUploader
                value={image}
                disabled={pending}
                onChange={setImage}
                onUploadStateChange={setUploading}
              />
              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending || uploading}
                  onClick={() => setImage(null)}
                >
                  Remove image
                </Button>
              )}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={pending || uploading}>
                {pending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
