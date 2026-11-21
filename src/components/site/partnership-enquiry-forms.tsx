import { useState, type FormEvent } from "react";
import { submitEnquiry } from "@/lib/showbizz/content";
import { whatsAppHref, type PublicSettings } from "@/lib/showbizz/settings";

type PartnershipKind = "car-business" | "content";

const control =
  "mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3 py-2 text-ink outline-none transition focus:border-accent";
const labelClass = "block text-sm font-medium";

function getValue(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function makeMessage(kind: PartnershipKind, form: FormData): string {
  const heading =
    kind === "car-business"
      ? "[COLLABORATION ENQUIRY: CAR BUSINESS / VEHICLE ACQUISITION]"
      : "[COLLABORATION ENQUIRY: CONTENT / CREATIVE PARTNERSHIP]";

  const fields: Array<[string, string]> =
    kind === "car-business"
      ? [
          ["Name / company", getValue(form, "contactName")],
          ["Email", getValue(form, "email")],
          ["Indicative vehicle budget", getValue(form, "budget")],
          ["Preferred arrangement", getValue(form, "arrangement")],
          ["Preferred car / vehicle idea", getValue(form, "vehicleIdea")],
          ["Additional details", getValue(form, "details")],
        ]
      : [
          ["Name / company", getValue(form, "contactName")],
          ["Email", getValue(form, "email")],
          ["Collaboration type", getValue(form, "collaborationType")],
          ["Social profile / portfolio", getValue(form, "portfolio")],
          ["Project / campaign idea", getValue(form, "projectIdea")],
          ["Additional details", getValue(form, "details")],
        ];

  return [heading, ...fields.filter(([, value]) => value).map(([name, value]) => `${name}: ${value}`)]
    .join("\n")
    .slice(0, 2000);
}

function makeWhatsAppHref(
  settings: PublicSettings,
  kind: PartnershipKind,
  name: string,
  phone: string,
  message: string,
): string | null {
  const kindLabel =
    kind === "car-business" ? "a car business / vehicle acquisition partnership" : "a content or creative partnership";
  return whatsAppHref(
    settings.whatsappE164,
    [
      `Hello Showbizz Cars, I would like to discuss ${kindLabel}.`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      "",
      message,
    ].join("\n"),
  );
}

export function PartnershipEnquiryForm({
  kind,
  settings,
}: {
  kind: PartnershipKind;
  settings: PublicSettings;
}) {
  const isCarBusiness = kind === "car-business";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [whatsAppLink, setWhatsAppLink] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contactName = getValue(form, "contactName");
    const phone = getValue(form, "phone");
    const email = getValue(form, "email");
    const message = makeMessage(kind, form);

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
          companyWebsite: getValue(form, "companyWebsite"),
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setWhatsAppLink(makeWhatsAppHref(settings, kind, contactName, phone, message));
      setDone(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not submit your partnership enquiry. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 sm:p-8" role="status">
        <p className="eyebrow">Enquiry saved</p>
        <h3 className="mt-3 font-display text-3xl">Thank you for reaching out.</h3>
        <p className="mt-3 text-sm leading-6 text-muted">
          Your {isCarBusiness ? "car business partnership" : "content partnership"} enquiry has been saved for the Showbizz Cars team. Any proposal, revenue share, payment or collaboration scope will be discussed and documented separately.
        </p>
        {whatsAppLink ? (
          <div className="mt-5">
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg">
              Continue to WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
            </a>
            <p className="mt-2 text-xs text-muted">Review the prefilled message and tap Send in WhatsApp.</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">WhatsApp is not configured yet. The enquiry remains saved for the team to follow up.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-line bg-surface p-5 sm:p-7">
      <p className="eyebrow">{isCarBusiness ? "Car business partnership" : "Content & creative partnership"}</p>
      <h3 className="mt-3 font-display text-3xl">
        {isCarBusiness ? "Explore a vehicle partnership." : "Let's create something together."}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted">
        {isCarBusiness
          ? "Interested in purchasing a recommended vehicle for business deployment? Share your indicative budget and preferred arrangement so we can understand your goals."
          : "For creators, influencers, filmmakers, production houses, agencies and brands. Tell us about your audience, project or campaign idea."}
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
        <label className={`${labelClass} sm:col-span-2`}>
          Email address <span className="font-normal text-muted">(optional)</span>
          <input name="email" type="email" maxLength={120} autoComplete="email" className={control} />
        </label>

        {isCarBusiness ? (
          <>
            <label className={labelClass}>
              Indicative vehicle budget
              <select name="budget" required defaultValue="" className={control}>
                <option value="" disabled>Select a budget range</option>
                <option value="Below ₹10 lakh">Below ₹10 lakh</option>
                <option value="₹10–25 lakh">₹10–25 lakh</option>
                <option value="₹25–50 lakh">₹25–50 lakh</option>
                <option value="₹50 lakh+">₹50 lakh+</option>
                <option value="To be discussed">To be discussed</option>
              </select>
            </label>
            <label className={labelClass}>
              Preferred arrangement
              <select name="arrangement" required defaultValue="" className={control}>
                <option value="" disabled>Select an arrangement</option>
                <option value="Revenue-sharing partnership">Revenue-sharing partnership</option>
                <option value="Fixed rental arrangement">Fixed rental arrangement</option>
                <option value="Need business guidance first">Need business guidance first</option>
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Preferred car / vehicle idea <span className="font-normal text-muted">(optional)</span>
              <input name="vehicleIdea" maxLength={300} placeholder="A model you have in mind, or ask for a discussion" className={control} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Tell us about your idea <span className="font-normal text-muted">(optional)</span>
              <textarea name="details" rows={4} maxLength={700} placeholder="Business goals, questions or relevant experience" className={control} />
            </label>
          </>
        ) : (
          <>
            <label className={`${labelClass} sm:col-span-2`}>
              Collaboration type
              <select name="collaborationType" required defaultValue="" className={control}>
                <option value="" disabled>Select a partnership type</option>
                <option value="Content creation">Content creation</option>
                <option value="Influencer / creator partnership">Influencer / creator partnership</option>
                <option value="Brand / promotional campaign">Brand / promotional campaign</option>
                <option value="Film / production house">Film / production house</option>
                <option value="Agency partnership">Agency partnership</option>
                <option value="Events / automotive experience">Events / automotive experience</option>
                <option value="Other creative collaboration">Other creative collaboration</option>
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Social profile / portfolio <span className="font-normal text-muted">(optional)</span>
              <input name="portfolio" maxLength={300} placeholder="Website, social handle or portfolio link" className={control} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Project or campaign idea
              <textarea name="projectIdea" required minLength={10} maxLength={700} rows={4} placeholder="Tell us about the concept, audience, deliverables or brand you represent" className={control} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Additional details <span className="font-normal text-muted">(optional)</span>
              <textarea name="details" rows={3} maxLength={500} placeholder="Preferred dates, channels or other useful context" className={control} />
            </label>
          </>
        )}
      </div>

      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="mt-6 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg disabled:cursor-wait disabled:opacity-60">
        {pending ? "Submitting…" : isCarBusiness ? "Send car partnership enquiry" : "Send creative partnership enquiry"}
      </button>
      <p className="mt-4 text-xs leading-5 text-muted">
        Submitting an enquiry is not an investment offer or guarantee of revenue, returns, vehicle suitability or project acceptance. Vehicle ownership, financing, insurance, maintenance, revenue calculation, expenses, responsibilities and termination terms must be reviewed and documented in a signed agreement. Content deliverables, usage rights, timelines and commercial terms are also agreed separately.
      </p>
    </form>
  );
}
