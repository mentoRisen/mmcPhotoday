export function slugFromEmail(email: string): string {
  return slugify(email.replace("@", "-at-"));
}

export function slugFromName(name: string): string {
  return slugify(name);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
