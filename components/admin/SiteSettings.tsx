"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import {
  getAllSiteSettings,
  upsertSiteSetting,
} from "@/app/services/siteSetting.service";
import type { JsonObject, JsonValue } from "@/app/types/api.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  Toggle,
  useAdminAction,
} from "@/components/admin/admin-ui";
import { jsonObject, textValue } from "@/components/admin/json-fields";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const queryKey = ["admin", "site-settings"] as const;

export function SiteSettings() {
  const query = useQuery({ queryKey, queryFn: getAllSiteSettings });
  const values = query.data ?? {};

  return (
    <>
      <AdminHeading
        title="Site Settings"
        description="Manage your store's branding, announcements, and footer."
      />
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Tabs defaultValue="branding" className="gap-4">
          <TabsList
            aria-label="Site settings"
            className="h-auto w-full flex-wrap justify-start sm:w-fit"
          >
            <TabsTrigger value="branding" className="min-h-8 px-3">
              General Branding
            </TabsTrigger>
            <TabsTrigger value="notice" className="min-h-8 px-3">
              Header Notice Bar
            </TabsTrigger>
            <TabsTrigger value="footer" className="min-h-8 px-3">
              Footer & Social Links
            </TabsTrigger>
          </TabsList>
          <TabsContent value="branding" keepMounted>
            <BrandingForm initial={jsonObject(values.GENERAL_INFO)} />
          </TabsContent>
          <TabsContent value="notice" keepMounted>
            <NoticeForm initial={jsonObject(values.HEADER_NOTICE)} />
          </TabsContent>
          <TabsContent value="footer" keepMounted>
            <div className="space-y-4">
              <FooterForm initial={jsonObject(values.FOOTER_LINKS)} />
              <SocialForm initial={values.SOCIAL_LINKS} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

function SettingsForm({
  title,
  settingKey,
  submitLabel,
  canSave = true,
  getValue,
  children,
}: {
  title: string;
  settingKey: string;
  submitLabel: string;
  canSave?: boolean;
  getValue: (data: FormData) => JsonValue;
  children: ReactNode;
}) {
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    const form = new FormData(event.currentTarget);
    void run(async () => {
      const saved = await upsertSiteSetting(settingKey, getValue(form));
      cache.setQueryData<JsonObject>(queryKey, (current = {}) => ({
        ...current,
        [saved.key]: saved.value,
      }));
    }, `${title} saved.`);
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="post" onSubmit={submit}>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            {children}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!canSave}>
                {busy ? "Saving?" : submitLabel}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}

function getText(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

function BrandingForm({ initial }: { initial: JsonObject }) {
  const [logo, setLogo] = useState(textValue(initial.logoUrl));
  const [favicon, setFavicon] = useState(textValue(initial.faviconUrl));
  const [logoPending, setLogoPending] = useState(false);
  const [faviconPending, setFaviconPending] = useState(false);

  return (
    <SettingsForm
      title="General branding"
      settingKey="GENERAL_INFO"
      submitLabel="Save branding"
      canSave={!logoPending && !faviconPending}
      getValue={(data) => ({
        ...initial,
        siteName: getText(data, "siteName"),
        contactEmail: getText(data, "contactEmail"),
        phone: getText(data, "phone"),
        address: getText(data, "address"),
        logoUrl: logo,
        faviconUrl: favicon,
      })}
    >
      <Field id="site-name" label="Site name">
        <Input
          id="site-name"
          name="siteName"
          defaultValue={textValue(initial.siteName)}
          required
        />
      </Field>
      <Field id="site-email" label="Contact email">
        <Input
          id="site-email"
          name="contactEmail"
          type="email"
          defaultValue={textValue(initial.contactEmail)}
        />
      </Field>
      <Field id="site-phone" label="Phone">
        <Input
          id="site-phone"
          name="phone"
          type="tel"
          defaultValue={textValue(initial.phone)}
        />
      </Field>
      <Field id="site-address" label="Address">
        <Input
          id="site-address"
          name="address"
          defaultValue={textValue(initial.address)}
        />
      </Field>
      <div role="group" aria-label="Logo" className="space-y-2">
        <span className="text-sm font-medium">Logo</span>
        <ImageUploader
          value={logo}
          onChange={setLogo}
          onUploadStateChange={setLogoPending}
        />
        {logo && (
          <Button
            type="button"
            variant="ghost"
            disabled={logoPending}
            onClick={() => setLogo("")}
          >
            Remove logo
          </Button>
        )}
      </div>
      <div role="group" aria-label="Favicon" className="space-y-2">
        <span className="text-sm font-medium">Favicon</span>
        <ImageUploader
          value={favicon}
          onChange={setFavicon}
          onUploadStateChange={setFaviconPending}
        />
        {favicon && (
          <Button
            type="button"
            variant="ghost"
            disabled={faviconPending}
            onClick={() => setFavicon("")}
          >
            Remove favicon
          </Button>
        )}
      </div>
    </SettingsForm>
  );
}

function NoticeForm({ initial }: { initial: JsonObject }) {
  const [enabled, setEnabled] = useState(
    typeof initial.isActive === "boolean"
      ? initial.isActive
      : initial.enabled === true,
  );
  return (
    <SettingsForm
      title="Header notice"
      settingKey="HEADER_NOTICE"
      submitLabel="Save notice"
      getValue={(data) => ({
        ...initial,
        enabled,
        isActive: enabled,
        text: getText(data, "text"),
        link: getText(data, "link"),
      })}
    >
      <div className="sm:col-span-2">
        <Toggle
          label="Show announcement bar"
          checked={enabled}
          onChange={setEnabled}
        />
      </div>
      <Field id="notice-text" label="Announcement text">
        <Input
          id="notice-text"
          name="text"
          defaultValue={textValue(initial.text)}
          required={enabled}
        />
      </Field>
      <Field id="notice-link" label="Link">
        <Input
          id="notice-link"
          name="link"
          defaultValue={textValue(initial.link)}
          placeholder="/products"
        />
      </Field>
    </SettingsForm>
  );
}

function FooterForm({ initial }: { initial: JsonObject }) {
  return (
    <SettingsForm
      title="Footer"
      settingKey="FOOTER_LINKS"
      submitLabel="Save footer"
      getValue={(data) => ({
        ...initial,
        description: getText(data, "description"),
        copyrightText: getText(data, "copyrightText"),
      })}
    >
      <div className="sm:col-span-2">
        <Field id="footer-description" label="Footer description">
          <Textarea
            id="footer-description"
            name="description"
            defaultValue={textValue(initial.description)}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="footer-copyright" label="Copyright text">
          <Input
            id="footer-copyright"
            name="copyrightText"
            defaultValue={textValue(initial.copyrightText)}
          />
        </Field>
      </div>
    </SettingsForm>
  );
}

function SocialForm({ initial }: { initial: JsonValue | undefined }) {
  const settings = jsonObject(initial);
  const originalLinks = Array.isArray(initial)
    ? initial
    : Array.isArray(settings.links)
      ? settings.links
      : [];
  const [links, setLinks] = useState(() =>
    originalLinks.map((entry, id) => ({ id, value: jsonObject(entry) })),
  );
  const nextId = useRef(originalLinks.length);
  const prefix = useId();

  return (
    <SettingsForm
      title="Social links"
      settingKey="SOCIAL_LINKS"
      submitLabel="Save social links"
      getValue={(data) => {
        const values = links.map(({ id, value }) => ({
          ...value,
          platform: getText(data, `platform-${id}`),
          url: getText(data, `url-${id}`),
        }));
        return initial && !Array.isArray(initial) && typeof initial === "object"
          ? { ...settings, links: values }
          : values;
      }}
    >
      <div className="space-y-3 sm:col-span-2">
        {links.length === 0 && (
          <p className="text-sm text-muted-foreground">No social links yet.</p>
        )}
        {links.map(({ id, value }, index) => (
          <div
            key={id}
            className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]"
          >
            <div className="col-span-2 sm:col-span-1">
              <Field id={`${prefix}-platform-${id}`} label="Platform">
                <Input
                  id={`${prefix}-platform-${id}`}
                  name={`platform-${id}`}
                  defaultValue={textValue(value.platform)}
                  placeholder="Instagram"
                  required
                />
              </Field>
            </div>
            <Field id={`${prefix}-url-${id}`} label="URL">
              <Input
                id={`${prefix}-url-${id}`}
                name={`url-${id}`}
                type="url"
                pattern="https?://.+"
                defaultValue={textValue(value.url)}
                required
              />
            </Field>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove social link ${index + 1}`}
              onClick={() =>
                setLinks((current) => current.filter((link) => link.id !== id))
              }
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const id = nextId.current++;
            setLinks((current) => [...current, { id, value: {} }]);
          }}
        >
          <Plus aria-hidden="true" /> Add social link
        </Button>
      </div>
    </SettingsForm>
  );
}
