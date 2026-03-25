import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["OFFICER", "STUDENT"]),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const otpVerificationSchema = z.object({
  challengeId: z.string().min(1, "Missing verification challenge"),
  code: z.string().length(6, "Enter the 6-digit code"),
});

export const otpResendSchema = z.object({
  challengeId: z.string().min(1, "Missing verification challenge"),
});
