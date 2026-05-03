import { z } from "zod";
import { isShortCompetitionFeasible } from "@/lib/schedule";

const optionalPhoto = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine(
    (value) =>
      !value ||
      value.startsWith("/uploads/") ||
      z.url().safeParse(value).success,
    "Gebruik een geldige foto-URL of upload een afbeelding.",
  );

export const personSchema = z.object({
  name: z.string().trim().min(2, "Naam is verplicht."),
  rankingLabel: z.string().trim().min(1, "Klassement is verplicht."),
  rankingValue: z
    .union([z.number().int().min(0).max(999), z.nan()])
    .optional()
    .transform((value) => (typeof value === "number" && !Number.isNaN(value) ? value : undefined)),
  photoUrl: optionalPhoto,
});

export const poolSchema = z.object({
  name: z.string().trim().min(1, "Poulenaam is verplicht."),
  size: z.number().int().min(4).max(24),
  competitionFormat: z.enum(["FULL", "SHORT"]).default("FULL"),
  duoTarget: z.number().int().min(1).max(12).default(1),
  personIds: z.array(z.string()).default([]),
}).superRefine((value, context) => {
  if (value.competitionFormat === "SHORT" && !isShortCompetitionFeasible(value.size, value.duoTarget)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["duoTarget"],
      message: "Deze duo-instelling is niet mogelijk voor dit aantal spelers. Kies een andere waarde.",
    });
  }
});

export const scoreSchema = z.object({
  team1Games: z.number().int().min(0).max(99),
  team2Games: z.number().int().min(0).max(99),
});

export const appUserSchema = z.object({
  name: z.string().trim().min(2, "Naam is verplicht."),
  username: z.string().trim().min(3, "Gebruikersnaam moet minimaal 3 tekens zijn."),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 tekens zijn."),
  role: z.enum(["VIEWER", "ADMIN", "MATCH_MANAGER"]),
});

export const updateUserSchema = appUserSchema.extend({
  password: z.string().min(6).optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Gebruikersnaam is verplicht."),
  password: z.string().min(1, "Wachtwoord is verplicht."),
});
