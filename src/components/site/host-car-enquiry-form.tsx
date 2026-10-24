import { useState, type FormEvent } from "react";
import { discardHostCarPhotos, submitHostCarEnquiry, uploadHostCarPhoto } from "@/lib/showbizz/content";

const control =
  "mt-2 w-full rounded-control border border-line bg-bg px-3 py-3 text-ink outline-none focus:border-accent";

type PreparedVehicleImage = {
  fileName: string;
  contentType: "image/webp";
  base64Data: string;
};

async function prepareVehicleImage(file: File): Promise<PreparedVehicleImage> {
  const supported = ["image/jpeg", "image/png", "image/webp"];
  if (!supported.includes(file.type)) {
    throw new Error("Please select JPEG, PNG, or WebP vehicle photos.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process one of the selected photos.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob: Blob | null = null;
  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob && blob.size <= 850 * 1024) break;
  }
  if (!blob || blob.size > 1024 * 1024) {
    throw new Error("A photo could not be compressed below 1 MB. Please choose a smaller image.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read one of the selected photos."));
    reader.readAsDataURL(blob!);
  });

  return {
    fileName: (file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 _().-]/g, "").trim().slice(0, 80) || "vehicle-photo") + ".webp",
    contentType: "image/webp",
    base64Data: dataUrl.split(",")[1] || "",
  };
}

function leadWhatsAppHref(baseHref: string, details: {
  contactName: string;
  phone: string;
  email: string;
  message: string;
}): string | null {
  try {
    const url = new URL(baseHref);
    const opening = url.searchParams.get("text") || "Hello, I would like to discuss hosting my vehicle with Showbizz Cars.";
    url.searchParams.set("text", [
      opening,
      "",
      "Vehicle owner submission from the website:",
      "Name: " + details.contactName,
      "Phone: " + details.phone,
      ...(details.email ? ["Email: " + details.email] : []),
      "",
      details.message,
    ].join("\n"));
    return url.toString();
  } catch {
    return null;
  }
}

export function HostCarEnquiryForm({ whatsAppHref }: { whatsAppHref: string | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWhatsAppHref, setSavedWhatsAppHref] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const details = {
      contactName: String(form.get("contactName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
    };
    const imageFiles = form.getAll("vehicleImages").filter(
      (value): value is File => value instanceof File && value.size > 0,
    );

    const vehicleDetails = [
      ["Brand & Model", form.get("vehicleMakeModel")],
      ["Year of Manufacture", form.get("modelYear")],
      ["Fuel Type", form.get("fuelType")],
      ["Transmission", form.get("transmission")],
      ["Current Odometer Reading", form.get("currentKilometres") ? String(form.get("currentKilometres")) + " km" : ""],
      ["State of Registration", form.get("registrationState")],
      ["Additional information", form.get("additionalInfo")],
    ]
      .map(([label, value]) => [String(label), String(value ?? "").trim()] as const)
      .filter(([, value]) => value.length > 0);
    const message = [
      "Vehicle partnership enquiry from the Host my car page.",
      ...vehicleDetails.map(([label, value]) => label + ": " + value),
    ].join("\n");

    const uploadedPhotoKeys: string[] = [];
    setPending(true);
    setError(null);
    setUploadStatus(null);
    try {
      for (let index = 0; index < imageFiles.length; index += 1) {
        const position = index + 1;
        setUploadStatus("Preparing photo " + position + " of " + imageFiles.length + "…");
        const image = await prepareVehicleImage(imageFiles[index]);
        setUploadStatus("Uploading photo " + position + " of " + imageFiles.length + "…");
        const upload = await uploadHostCarPhoto({ data: image });
        if (!upload.ok) throw new Error("Photo " + position + ": " + upload.error);
        uploadedPhotoKeys.push(upload.storageKey);
      }

      setUploadStatus("Saving your vehicle details…");
      const result = await submitHostCarEnquiry({
        data: {
          formData: {
            ...details,
            message,
            startOn: "",
            endOn: "",
            vehicleSlug: "",
            companyWebsite: String(form.get("companyWebsite") ?? ""),
          },
          images: uploadedPhotoKeys,
        },
      });
      if (!result.ok) {
        if (uploadedPhotoKeys.length) {
          try { await discardHostCarPhotos({ data: uploadedPhotoKeys }); } catch { /* Preserve the submission error. */ }
        }
        setError(result.error);
        return;
      }

      setSavedWhatsAppHref(
        whatsAppHref
          ? leadWhatsAppHref(whatsAppHref, { ...details, message })
          : null,
      );
      setDone(true);
    } catch (err) {
      if (uploadedPhotoKeys.length) {
        try { await discardHostCarPhotos({ data: uploadedPhotoKeys }); } catch { /* Preserve the upload error. */ }
      }
      setError(err instanceof Error ? err.message : "Could not submit your vehicle details.");
    } finally {
      setPending(false);
      setUploadStatus(null);
    }
  }
  if (done) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 sm:p-8" role="status">
        <p className="eyebrow">Submission received</p>
        <h3 className="mt-3 font-display text-3xl">Thank you for sharing your vehicle details.</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Your enquiry and selected vehicle photos have been saved for the Showbizz Cars team to review.
          Submission does not guarantee vehicle acceptance or rental income.
        </p>
        {savedWhatsAppHref ? (
          <div className="mt-5">
            <a href={savedWhatsAppHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg">
              Continue to WhatsApp <span className="ml-2" aria-hidden="true">↗</span>
            </a>
            <p className="mt-2 text-xs text-muted">Review the prefilled details, then tap Send in WhatsApp. Your uploaded photos are already saved with the enquiry for our team.</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">WhatsApp is not configured yet. The team can follow up using the contact details you provided.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-card border border-line bg-surface p-5 sm:p-8">
      <p className="eyebrow">List your vehicle</p>
      <h3 className="mt-3 font-display text-3xl sm:text-4xl">Tell us about your car.</h3>
      <p className="mt-3 text-sm leading-6 text-muted">
        Share the details below so our team can review suitability. We will discuss commercial and operating terms before any agreement.
      </p>
      <div className="hp" aria-hidden="true">
        <label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Your name
          <input name="contactName" autoComplete="name" required maxLength={80} className={control} />
        </label>
        <label className="text-sm font-medium">Phone number
          <input name="phone" autoComplete="tel" inputMode="tel" required className={control} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Email address <span className="font-normal text-muted">(optional)</span>
          <input name="email" type="email" autoComplete="email" className={control} />
        </label>
        <label className="text-sm font-medium">Brand &amp; Model
          <input name="vehicleMakeModel" required maxLength={200} placeholder="e.g. BMW X5" className={control} />
        </label>
        <label className="text-sm font-medium">Year of Manufacture
          <input name="modelYear" type="number" required min={1900} max={new Date().getFullYear()} step={1} placeholder="e.g. 2023" className={control} />
        </label>
        <label className="text-sm font-medium">Fuel Type
          <select name="fuelType" required defaultValue="" className={control}>
            <option value="" disabled>Select fuel type</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="EV">EV</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>
        <label className="text-sm font-medium">Transmission
          <select name="transmission" required defaultValue="" className={control}>
            <option value="" disabled>Select transmission</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label className="text-sm font-medium">Current Odometer Reading (km)
          <input name="currentKilometres" type="number" required min={0} step={1} placeholder="e.g. 42000" className={control} />
        </label>
        <label className="text-sm font-medium">State of Registration
          <input name="registrationState" required maxLength={100} placeholder="e.g. Karnataka" className={control} />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Vehicle Photos <span className="font-normal text-muted">(optional)</span>
          <input
            name="vehicleImages"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className={control + " file:mr-3 file:rounded-control file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent-fg"}
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              setSelectedImages(files.map((file) => file.name));
              setError(null);
            }}
          />
          <span className="mt-2 block text-xs font-normal leading-5 text-muted">JPEG, PNG or WebP. Photos are resized before upload. Add as many images as you need.</span>
          {selectedImages.length > 0 ? <span className="mt-2 block text-xs font-normal text-muted">Selected: {selectedImages.join(", ")}</span> : null}
        </label>
        <label className="text-sm font-medium sm:col-span-2">Additional information <span className="font-normal text-muted">(optional)</span>
          <textarea name="additionalInfo" rows={3} maxLength={1000} placeholder="Anything else we should know?" className={control} />
        </label>
      </div>
      {uploadStatus ? <p role="status" className="mt-4 text-sm text-muted">{uploadStatus}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={pending} className="mt-6 inline-flex min-h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-accent-fg disabled:cursor-wait disabled:opacity-60">
        {pending ? uploadStatus || "Submitting…" : "Submit vehicle details"}
      </button>
      <p className="mt-4 text-xs leading-5 text-muted">
        Rental income is not guaranteed by submitting a vehicle. Insurance coverage, permitted use, maintenance, operating costs and vehicle-return conditions must be agreed and verified before onboarding.
      </p>
    </form>
  );
}
