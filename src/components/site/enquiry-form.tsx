import { useState, type FormEvent } from "react";
import { submitEnquiry } from "@/lib/showbizz/content";

const control =
  "mt-2 w-full rounded-control border border-line bg-bg px-3 text-ink outline-none";

function leadWhatsAppHref(
  baseHref: string,
  details: { contactName: string; phone: string; email: string; message: string },
): string | null {
  try {
    const url = new URL(baseHref);
    const opening = url.searchParams.get("text") || "Hello, I would like to enquire about a car with Showbizz Cars.";
    const lines = [
      opening,
      "",
      "Website enquiry details:",
      `Name: ${details.contactName}`,
      `Phone: ${details.phone}`,
      ...(details.email ? [`Email: ${details.email}`] : []),
      `Message: ${details.message}`,
    ];
    url.searchParams.set("text", lines.join("\n"));
    return url.toString();
  } catch {
    return null;
  }
}

export function EnquiryForm({
  vehicleSlug = "",
  whatsAppHref = null,
}: {
  vehicleSlug?: string;
  whatsAppHref?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [submittedWhatsAppHref, setSubmittedWhatsAppHref] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = {
      contactName: String(form.get("contactName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      message: String(form.get("message") ?? "").trim(),
    };
    setPending(true);
    setError(null);
    try {
      const result = await submitEnquiry({
        data: {
          ...details,
          startOn: "",
          endOn: "",
          vehicleSlug,
          companyWebsite: String(form.get("companyWebsite") ?? ""),
        },
      });
      if (!result.ok) setError(result.error);
      else {
        setSubmittedWhatsAppHref(whatsAppHref ? leadWhatsAppHref(whatsAppHref, details) : null);
        setDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the enquiry.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-line bg-surface p-4">
        <h2 className="font-display text-2xl">Enquiry saved</h2>
        <p className="mt-3 text-sm text-muted">
          Your enquiry has been saved. This is not a confirmed reservation, and no payment has been taken.
        </p>
        {submittedWhatsAppHref ? (
          <p className="mt-4">
            <a
              className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-accent-fg"
              href={submittedWhatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Continue to WhatsApp with enquiry details ↗
            </a>
            <span className="mt-2 block text-xs text-muted">Review the message in WhatsApp and tap Send to contact the team.</span>
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">WhatsApp is not configured yet. The team can follow up using the contact details you provided.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-line bg-surface p-4" noValidate>
      <h2 className="font-display text-2xl">Send an enquiry</h2>
      <p className="mt-2 text-sm text-muted">
        Share your contact details and message, and our team will get back to you.
      </p>
      <div className="hp" aria-hidden="true">
        <label>
          Company website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Name
          <input name="contactName" autoComplete="name" required maxLength={80} className={`${control} h-11`} />
        </label>
        <label className="text-sm font-medium">
          Phone
          <input name="phone" autoComplete="tel" inputMode="tel" required className={`${control} h-11`} />
        </label>
        <label className="text-sm font-medium">
          Email <span className="font-normal text-muted">(optional)</span>
          <input name="email" type="email" autoComplete="email" className={`${control} h-11`} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium">
        Message
        <textarea name="message" required minLength={10} maxLength={2000} className={`${control} min-h-32 py-3`} />
      </label>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex h-11 items-center rounded-control bg-accent px-5 text-sm font-medium text-accent-fg disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending…" : "Save enquiry"}
      </button>
    </form>
  );
}
