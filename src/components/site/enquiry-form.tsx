import { useState, type FormEvent } from "react";
import { submitEnquiry } from "@/lib/showbizz/content";

const control =
  "mt-2 w-full rounded-control border border-line bg-bg px-3 text-ink outline-none";

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await submitEnquiry({
        data: {
          contactName: String(form.get("contactName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          message: String(form.get("message") ?? ""),
          startOn: String(form.get("startOn") ?? ""),
          endOn: String(form.get("endOn") ?? ""),
          vehicleSlug,
          companyWebsite: String(form.get("companyWebsite") ?? ""),
        },
      });
      if (!result.ok) setError(result.error);
      else setDone(true);
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
          This is not a confirmed reservation, and no payment has been taken. The team reviews enquiries manually.
        </p>
        {whatsAppHref ? (
          <p className="mt-4">
            <a className="underline" href={whatsAppHref} rel="noreferrer">
              Continue the same enquiry on WhatsApp
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-line bg-surface p-4" noValidate>
      <h2 className="font-display text-2xl">Send an enquiry</h2>
      <p className="mt-2 text-sm text-muted">
        Required fields are name, phone, and a short message. Dates are optional.
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
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            Start <span className="font-normal text-muted">(optional)</span>
            <input name="startOn" type="date" className={`${control} h-11`} />
          </label>
          <label className="text-sm font-medium">
            End <span className="font-normal text-muted">(optional)</span>
            <input name="endOn" type="date" className={`${control} h-11`} />
          </label>
        </div>
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
