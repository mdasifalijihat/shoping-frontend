"use client";

import { useState } from "react";

import {
  createPaymentMethod,
  deletePaymentMethod,
  getAdminPaymentMethods,
  updatePaymentMethod,
  type PaymentMethodInput,
} from "@/app/services/paymentMethod.service";
import type { IPaymentMethod } from "@/app/types/payment.types";
import {
  CommerceManager,
  CommerceFormButtons,
  formText,
  type CommerceFormProps,
} from "@/components/admin/CommerceManager";
import { Field, Toggle } from "@/components/admin/admin-ui";
import { CatalogImage } from "@/components/admin/catalog-ui";
import { paymentMethodsKey } from "@/components/admin/commerce-format";
import {
  draftPaymentFields,
  PaymentFieldBuilder,
  readPaymentFields,
} from "@/components/admin/PaymentFieldBuilder";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PaymentMethodsPage() {
  return (
    <CommerceManager<IPaymentMethod, PaymentMethodInput>
      title="Payment Methods"
      description="Configure payment options and the information customers submit at checkout."
      singular="payment method"
      queryKey={paymentMethodsKey}
      list={getAdminPaymentMethods}
      update={updatePaymentMethod}
      remove={deletePaymentMethod}
      name={(item) => item.name}
      create={(data, items) =>
        createPaymentMethod({
          ...data,
          orderIndex:
            Math.max(-1, ...items.map(({ orderIndex }) => orderIndex)) + 1,
        })
      }
      columns={[
        {
          label: "Payment method",
          render: (item) => (
            <div className="flex items-center gap-3">
              <CatalogImage url={item.logoUrl} alt="" className="size-9" />
              <span className="font-medium">{item.name}</span>
            </div>
          ),
        },
        {
          label: "Account number",
          render: (item) => item.accountNumber ?? "—",
        },
        {
          label: "Checkout fields",
          render: (item) => item.customFieldsSchema.length,
        },
      ]}
      wide
      renderForm={(props) => <PaymentForm {...props} />}
    />
  );
}

function PaymentForm({
  item,
  busy,
  save,
  cancel,
  setUploading,
}: CommerceFormProps<IPaymentMethod, PaymentMethodInput>) {
  const [fields, setFields] = useState(() =>
    draftPaymentFields(item?.customFieldsSchema ?? []),
  );
  const [logoUrl, setLogo] = useState(item?.logoUrl ?? "");
  const [active, setActive] = useState(item?.isActive ?? true);
  const [uploading, setPending] = useState(false);

  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        save(() => {
          const name = formText(form, "name");
          if (!name) throw new Error("Enter a payment method name.");
          return {
            name,
            logoUrl: logoUrl || null,
            accountNumber: formText(form, "account") || null,
            instructions: formText(form, "instructions") || null,
            isActive: active,
            customFieldsSchema: readPaymentFields(fields),
          };
        });
      }}
    >
      <fieldset disabled={busy} className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-3">
            <Field id="method-name" label="Name">
              <Input
                id="method-name"
                name="name"
                required
                defaultValue={item?.name}
              />
            </Field>
            <Field id="method-account" label="Account number">
              <Input
                id="method-account"
                name="account"
                defaultValue={item?.accountNumber ?? ""}
              />
            </Field>
            <Field id="method-instructions" label="Instructions">
              <Textarea
                id="method-instructions"
                name="instructions"
                defaultValue={item?.instructions ?? ""}
              />
            </Field>
            <Toggle label="Active" checked={active} onChange={setActive} />
          </div>
          <div
            role="group"
            aria-label="Payment method logo"
            className="space-y-2"
          >
            <p className="text-sm font-medium">Logo</p>
            <ImageUploader
              value={logoUrl}
              onChange={setLogo}
              onUploadStateChange={(pending) => {
                setPending(pending);
                setUploading(pending);
              }}
            />
            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                disabled={uploading}
                onClick={() => setLogo("")}
              >
                Remove logo
              </Button>
            )}
          </div>
        </div>
        <PaymentFieldBuilder fields={fields} onChange={setFields} />
        <CommerceFormButtons
          busy={busy}
          uploading={uploading}
          editing={!!item}
          cancel={cancel}
        />
      </fieldset>
    </form>
  );
}
