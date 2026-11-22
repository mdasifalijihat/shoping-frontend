"use client";

import { useState } from "react";

import {
  createCoupon,
  deleteCoupon,
  getAdminCoupons,
  updateCoupon,
  type CouponInput,
} from "@/app/services/paymentMethod.service";
import type { ICoupon } from "@/app/types/payment.types";
import {
  CommerceManager,
  CommerceFormButtons,
  formText,
  optionalAmount,
  type CommerceFormProps,
} from "@/components/admin/CommerceManager";
import { Field, SelectField, Toggle } from "@/components/admin/admin-ui";
import {
  couponsKey,
  displayDate,
  money,
} from "@/components/admin/commerce-format";
import { Input } from "@/components/ui/input";

const localExpiry = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export default function CouponsPage() {
  return (
    <CommerceManager<ICoupon, CouponInput>
      title="Coupons"
      description="Manage promo codes, discount limits, and expiry dates."
      singular="coupon"
      queryKey={couponsKey}
      list={getAdminCoupons}
      update={updateCoupon}
      remove={deleteCoupon}
      name={(item) => item.code}
      create={createCoupon}
      columns={[
        {
          label: "Code",
          render: (item) => (
            <span className="font-mono font-semibold">{item.code}</span>
          ),
        },
        {
          label: "Discount",
          render: (item) =>
            item.discountType === "PERCENTAGE"
              ? `${item.discountValue}%`
              : money.format(item.discountValue),
        },
        {
          label: "Minimum order",
          render: (item) =>
            item.minOrderAmount === null
              ? "—"
              : money.format(item.minOrderAmount),
        },
        {
          label: "Uses",
          render: (item) =>
            item.usageLimit === null
              ? item.usedCount
              : `${item.usedCount} / ${item.usageLimit}`,
        },
        {
          label: "Expires (Dhaka)",
          render: (item) =>
            item.expiresAt ? displayDate(item.expiresAt) : "No expiry",
        },
      ]}
      renderForm={(props) => <CouponForm {...props} />}
    />
  );
}

function CouponForm({
  item,
  busy,
  save,
  cancel,
}: CommerceFormProps<ICoupon, CouponInput>) {
  const [active, setActive] = useState(item?.isActive ?? true);
  const [type, setType] = useState<ICoupon["discountType"]>(
    item?.discountType ?? "PERCENTAGE",
  );
  const initialExpiry = item?.expiresAt
    ? localExpiry.format(new Date(item.expiresAt)).replace(" ", "T")
    : "";
  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        save(() => {
          const code = formText(form, "code").toUpperCase();
          const discountValue = optionalAmount(form, "discountValue");
          if (
            !code ||
            discountValue === null ||
            !Number.isFinite(discountValue) ||
            discountValue <= 0
          )
            throw new Error(
              "Enter a coupon code and a discount greater than zero.",
            );
          if (type === "PERCENTAGE" && discountValue > 100)
            throw new Error("Percentage discounts cannot exceed 100.");
          const expiry = formText(form, "expiresAt");
          const normalizedExpiry =
            expiry.length === 16 ? `${expiry}:00` : expiry;
          const expiresAt = !expiry
            ? null
            : normalizedExpiry === initialExpiry
              ? (item?.expiresAt ?? null)
              : new Date(`${normalizedExpiry}+06:00`).toISOString();
          return {
            code,
            discountType: type,
            discountValue,
            minOrderAmount: optionalAmount(form, "minOrderAmount"),
            maxDiscount: optionalAmount(form, "maxDiscount"),
            usageLimit: optionalAmount(form, "usageLimit"),
            expiresAt,
            isActive: active,
          };
        });
      }}
    >
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field id="coupon-code" label="Code">
          <Input
            id="coupon-code"
            name="code"
            defaultValue={item?.code}
            required
          />
        </Field>
        <Field id="coupon-type" label="Discount type">
          <SelectField
            id="coupon-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value === "FIXED" ? "FIXED" : "PERCENTAGE")
            }
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </SelectField>
        </Field>
        <Field
          id="coupon-value"
          label={type === "PERCENTAGE" ? "Discount (%)" : "Discount (BDT)"}
        >
          <Input
            id="coupon-value"
            name="discountValue"
            type="number"
            min="0"
            max={type === "PERCENTAGE" ? 100 : undefined}
            step="any"
            defaultValue={item?.discountValue}
            required
          />
        </Field>
        <Field id="coupon-min" label="Minimum order (BDT)">
          <Input
            id="coupon-min"
            name="minOrderAmount"
            type="number"
            min="0"
            step="any"
            defaultValue={item?.minOrderAmount ?? ""}
          />
        </Field>
        <Field id="coupon-max" label="Maximum discount (BDT)">
          <Input
            id="coupon-max"
            name="maxDiscount"
            type="number"
            min="0"
            step="any"
            defaultValue={item?.maxDiscount ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Applies to percentage discounts.
          </p>
        </Field>
        <Field id="coupon-limit" label="Usage limit">
          <Input
            id="coupon-limit"
            name="usageLimit"
            type="number"
            min="0"
            max="2147483647"
            step="1"
            defaultValue={item?.usageLimit ?? ""}
          />
        </Field>
        <Field id="coupon-expiry" label="Expires at (Dhaka time)">
          <Input
            id="coupon-expiry"
            name="expiresAt"
            type="datetime-local"
            step="1"
            defaultValue={initialExpiry}
          />
        </Field>
        <div className="self-end pb-1">
          <Toggle label="Active" checked={active} onChange={setActive} />
        </div>
        <div className="sm:col-span-2">
          <CommerceFormButtons busy={busy} editing={!!item} cancel={cancel} />
        </div>
      </fieldset>
    </form>
  );
}
