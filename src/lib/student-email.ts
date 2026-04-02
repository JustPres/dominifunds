export const STUDENT_EMAIL_DOMAIN = "@sdca.edu.ph";

export function normalizeStudentEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidStudentEmail(value?: string | null) {
  if (!value) return false;

  return /^[^\s@]+@sdca\.edu\.ph$/i.test(normalizeStudentEmail(value));
}

export function getStudentEmailValidationMessage(value?: string | null) {
  if (!value?.trim()) {
    return "School email is required.";
  }

  return isValidStudentEmail(value)
    ? null
    : "Student accounts must use an @sdca.edu.ph email address.";
}

export function isOptionalValidStudentEmail(value?: string | null) {
  if (!value?.trim()) return true;
  return isValidStudentEmail(value);
}
