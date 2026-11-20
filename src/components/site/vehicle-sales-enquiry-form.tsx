import { useState, type FormEvent } from "react";
import { submitEnquiry } from "@/lib/showbizz/content";
import { whatsAppHref, type PublicSettings } from "@/lib/showbizz/settings";

const control =
  "mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3 py-2 text-ink outline-none transition focus:border-accent";
const labelClass = "block text-sm font-medium";

function value(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

export function VehicleSalesEnquiryForm({ settings }: { settings: PublicSettings }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [whatsAppLink, setWhatsAppLink] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contactName = value(form, "contactName");
    const phone = value(form, "phone");
    const email = value(form, "email");
    const vehicle = [
      ["Seller relationship", value(form, "sellerRelationship")],
      ["Car make and model", value(form, "vehicleModel")],
      ["Year", value(form, "modelYear")],
      ["Kilometres driven", value(form, "kilometres") ? value(form, "kilometres") + " km" : ""],
      ["Expected selling price", value(form, "askingPrice") ? "₹" + value(form, "askingPrice") : ""],
      ["Location", value(form, "location")],
      ["Photo / listing link", value(form, "photoLink")],
      ["Additional details", value(form, "details")],
    ].filter(([, answer]) => answer);

    const message = [
      "[VEHICLE SALE PROMOTION]",
      "I would like Showbizz Cars to review my vehicle for promotional and buyer-referral opportunities.",
      ...vehicle.map(([label, answer]) => label + ": " + answer),
    ].join("\n");

    setPending(true);
    setError(null);
    try {
      const result = await submitEnquiry({
        data: {
          contactName,
          phone,
          email,
          message,
          startOn: "",
          endOn: "",
          vehicleSlug: "",
          companyWebsite: value(form, "companyWebsite"),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWhatsAppLink(
        whatsAppHref(
          settings.whatsappE164,
          [
            "Hello Showbizz Cars, I have submitted a vehicle sale promotion enquiry.",
            "Name: " + contactName,
            "Phone: " + phone,
            ...(email ? ["Email: " + email] : []),
            "",
            ...vehicle.map(([label, answer]) => label + ": " + answer),
          ].join("\n"),
        ),
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your vehicle promotion enquiry.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 sm:p-8" role="status">
        <p className="eyebrow">Enquiry received</p>
        <h3 className="mt-3 font-display text-3xl">Your car is in for review.</h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          Your vehicle sale enquiry has been saved for the Showbizz Cars team. The team will review the details before agreeing to promote the vehicle or share it with potential buyers.
        </p>
        {whatsAppLink ? (
          <div className="mt-5">
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg">
              Continue to WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
            </a>
            <p className="mt-2 text-xs text-muted">Review the prefilled details and tap Send in WhatsApp.</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">Your enquiry is saved. The team can follow up using your contact details.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-line bg-surface p-5 sm:p-7">
      <p className="eyebrow">Vehicle sales & referral enquiry</p>
      <h3 className="mt-3 font-display text-3xl">Put your car in front of potential buyers.</h3>
      <p className="mt-3 text-sm leading-6 text-muted">
        Tell us about the vehicle and your role. The team will review the details and contact you to discuss suitable promotion and referral terms.
      </p>
      <div className="hp" aria-hidden="true">
        <label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Your name
          <input name="contactName" required minLength={2} maxLength={80} autoComplete="name" className={control} />
        </label>
        <label className={labelClass}>
          Mobile / WhatsApp number
          <input name="phone" required autoComplete="tel" inputMode="tel" className={control} />
        </label>
        <label className={labelClass + " sm:col-span-2"}>
          Email address <span className="font-normal text-muted">(optional)</span>
          <input name="email" type="email" maxLength={120} autoComplete="email" className={control} />
        </label>
        <label className={labelClass}>
          I am the…
          <select name="sellerRelationship" required defaultValue="" className={control}>
            <option value="" disabled>Select your relationship</option>
            <option value="Vehicle owner">Vehicle owner</option>
            <option value="Authorised representative">Authorised representative</option>
            <option value="Dealer / broker">Dealer / broker</option>
          </select>
        </label>
        <label className={labelClass}>
          Car make and model
          <input name="vehicleModel" required maxLength={120} placeholder="e.g. BMW 3 Series" className={control} />
        </label>
        <label className={labelClass}>
          Year of manufacture
          <input name="modelYear" type="number" required min={1980} max={new Date().getFullYear()} step={1} placeholder="e.g. 2022" className={control} />
        </label>
        <label className={labelClass}>
          Kilometres driven
          <input name="kilometres" type="number" required min={0} step={1} placeholder="e.g. 38000" className={control} />
        </label>
        <label className={labelClass}>
          Expected selling price (₹)
          <input name="askingPrice" type="number" required min={1} step={1000} placeholder="e.g. 1250000" className={control} />
        </label>
        <label className={labelClass}>
          Vehicle location
          <input name="location" required maxLength={120} placeholder="City, State" className={control} />
        </label>
        <label className={labelClass}>
          Photos / listing link <span className="font-normal text-muted">(optional)</span>
          <input name="photoLink" type="url" maxLength={500} placeholder="Link to car photos or listing" className={control} />
        </label>
        <label className={labelClass + " sm:col-span-2"}>
          Anything else buyers should know? <span className="font-normal text-muted">(optional)</span>
          <textarea name="details" rows={3} maxLength={600} placeholder="Variant, ownership history, condition, price negotiability or other details" className={control} />
        </label>
      </div>

      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="mt-6 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg disabled:cursor-wait disabled:opacity-60">
        {pending ? "Submitting…" : "Submit vehicle for review"}
      </button>
      <p className="mt-4 text-xs leading-5 text-muted">
        Submitting does not automatically publish a listing or guarantee a sale. Showbizz Cars will review ownership or selling authority, vehicle details, promotional scope and any referral commission with you before proceeding.
      </p>
    </form>
  );
}
