import { z } from "zod";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseSlug(input: unknown): string | null {
  if (typeof input !== "string") return null;
  if (input.length < 1 || input.length > 80) return null;
  if (!SLUG_PATTERN.test(input)) return null;
  return input;
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real date.");

export const enquiryInputSchema = z
  .object({
    contactName: z.string().trim().min(2, "Enter your name.").max(80),
    phone: z
      .string()
      .trim()
      .transform(normalizePhone)
      .refine((phone) => /^\+?\d{8,15}$/.test(phone), "Enter a phone number of 8 to 15 digits."),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email.").max(120)]),
    message: z.string().trim().min(10, "Add a short message.").max(2000),
    startOn: z.union([z.literal(""), isoDate]),
    endOn: z.union([z.literal(""), isoDate]),
    vehicleSlug: z.union([z.literal(""), z.string().trim()]),
    companyWebsite: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.companyWebsite.trim() !== "") {
      ctx.addIssue({ code: "custom", message: "Could not send the enquiry.", path: ["companyWebsite"] });
    }
    if (value.startOn && value.endOn && value.endOn < value.startOn) {
      ctx.addIssue({
        code: "custom",
        message: "The end date must be on or after the start date.",
        path: ["endOn"],
      });
    }
    if (value.vehicleSlug && !parseSlug(value.vehicleSlug)) {
      ctx.addIssue({ code: "custom", message: "That vehicle link is not valid.", path: ["vehicleSlug"] });
    }
  });

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export function parseEnquiry(
  input: unknown,
): { ok: true; value: EnquiryInput } | { ok: false; error: string } {
  const parsed = enquiryInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  return { ok: true, value: parsed.data };
}
