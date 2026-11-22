"use client";

import { useState } from "react";

import {
  createShippingZone,
  deleteShippingZone,
  getAdminShippingZones,
  updateShippingZone,
  type ShippingZoneInput,
} from "@/app/services/paymentMethod.service";
import type { IShippingZone } from "@/app/types/payment.types";
import {
  CommerceManager,
  CommerceFormButtons,
  formText,
  optionalAmount,
  type CommerceFormProps,
} from "@/components/admin/CommerceManager";
import { Field, Toggle } from "@/components/admin/admin-ui";
import { money, shippingZonesKey } from "@/components/admin/commerce-format";
import { Input } from "@/components/ui/input";

export default function ShippingZonesPage() {
  return (
    <CommerceManager<IShippingZone, ShippingZoneInput>
      title="Shipping Zones"
      description="Set delivery charges for the zones available at checkout."
      singular="shipping zone"
      queryKey={shippingZonesKey}
      list={getAdminShippingZones}
      update={updateShippingZone}
      remove={deleteShippingZone}
      name={(item) => item.name}
      create={(data, items) =>
        createShippingZone({
          ...data,
          orderIndex:
            Math.max(-1, ...items.map(({ orderIndex }) => orderIndex)) + 1,
        })
      }
      columns={[
        {
          label: "Zone",
          render: (item) => <span className="font-medium">{item.name}</span>,
        },
        {
          label: "Delivery charge",
          render: (item) => money.format(item.charge),
        },
      ]}
      renderForm={(props) => <ShippingForm {...props} />}
    />
  );
}

function ShippingForm({
  item,
  busy,
  save,
  cancel,
}: CommerceFormProps<IShippingZone, ShippingZoneInput>) {
  const [active, setActive] = useState(item?.isActive ?? true);
  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        save(() => {
          const name = formText(form, "name");
          const charge = optionalAmount(form, "charge");
          if (
            !name ||
            charge === null ||
            !Number.isFinite(charge) ||
            charge < 0
          )
            throw new Error(
              "Enter a zone name and a non-negative delivery charge.",
            );
          return { name, charge, isActive: active };
        });
      }}
    >
      <fieldset disabled={busy} className="space-y-4">
        <Field id="zone-name" label="Zone name">
          <Input
            id="zone-name"
            name="name"
            defaultValue={item?.name}
            required
          />
        </Field>
        <Field id="zone-charge" label="Delivery charge (BDT)">
          <Input
            id="zone-charge"
            name="charge"
            type="number"
            min="0"
            step="any"
            defaultValue={item?.charge}
            required
          />
        </Field>
        <Toggle label="Active" checked={active} onChange={setActive} />
        <CommerceFormButtons busy={busy} editing={!!item} cancel={cancel} />
      </fieldset>
    </form>
  );
}
