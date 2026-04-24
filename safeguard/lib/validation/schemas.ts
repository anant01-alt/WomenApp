/**
 * Shared Zod schemas — imported by both Server Actions (server-side parsing)
 * and client forms (react-hook-form + @hookform/resolvers/zod).
 *
 * Rule: never let unparsed FormData or JSON reach the database. Every mutation
 * parses through one of these schemas first.
 */

import { z } from "zod";

// E.164 phone format (`+` then country code then subscriber, max 15 digits).
const e164 = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, e.g. +919876543210")
  .optional()
  .or(z.literal(""));

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const SignInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});
export type SignInInput = z.infer<typeof SignInSchema>;

// ─── Profile ──────────────────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Too long."),
  phone: e164,
  address: z.string().trim().max(250).optional().or(z.literal("")),
  timezone: z.string().trim().min(1).max(50).default("UTC"),
  age_confirmed_18: z.boolean().refine((v) => v === true, {
    message: "You must be 18 or older to use SafeGuard.",
  }),
});
export type ProfileInput = z.infer<typeof ProfileSchema>;

// ─── Emergency contact ────────────────────────────────────────────────────────
export const EmergencyContactSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120),
    phone: e164,
    email: z
      .string()
      .email("Invalid email.")
      .optional()
      .or(z.literal("")),
    relationship: z.enum([
      "mother",
      "father",
      "sister",
      "brother",
      "spouse",
      "friend",
      "colleague",
      "other",
    ]),
    is_primary: z.boolean().default(false),
    consent_confirmed: z.boolean().refine((v) => v === true, {
      message: "Confirm that you have permission to contact this person.",
    }),
  })
  .refine((v) => !!v.phone || !!v.email, {
    message: "Provide at least a phone number or an email address.",
    path: ["phone"],
  });
export type EmergencyContactInput = z.infer<typeof EmergencyContactSchema>;

// ─── SOS trigger ──────────────────────────────────────────────────────────────
export const SosTriggerSchema = z.object({
  message: z.string().trim().max(500).optional(),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  location_address: z.string().trim().max(250).optional(),
  triggered_by: z.enum(["manual", "shake", "checkin_timeout", "fake_call"]),
});
export type SosTriggerInput = z.infer<typeof SosTriggerSchema>;

// ─── Check-in ─────────────────────────────────────────────────────────────────
export const CheckinCreateSchema = z.object({
  interval_minutes: z.coerce.number().int().min(5).max(720),
  grace_period_minutes: z.coerce.number().int().min(0).max(60).default(2),
  message_template: z.string().trim().max(250).optional(),
});
export type CheckinCreateInput = z.infer<typeof CheckinCreateSchema>;

// ─── Tracking link ────────────────────────────────────────────────────────────
export const TrackingLinkCreateSchema = z.object({
  expires_in_hours: z.union([
    z.literal(1),
    z.literal(6),
    z.literal(24),
    z.literal(72),
  ]),
  passcode: z
    .string()
    .regex(/^\d{4}$/, "Passcode must be exactly 4 digits.")
    .optional()
    .or(z.literal("")),
});
export type TrackingLinkCreateInput = z.infer<typeof TrackingLinkCreateSchema>;

export const TrackingLinkValidateSchema = z.object({
  passcode: z
    .string()
    .regex(/^\d{4}$/, "Passcode must be exactly 4 digits.")
    .optional(),
});
export type TrackingLinkValidateInput = z.infer<
  typeof TrackingLinkValidateSchema
>;

// ─── Push subscription ────────────────────────────────────────────────────────
export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;
