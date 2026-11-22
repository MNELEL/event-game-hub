import { branding } from "@/config/branding";

/** Read a session's name without falling back to another host's branding. */
export function getGameTitle(settings: unknown): string {
  if (settings && typeof settings === "object" && "title" in settings &&
      typeof settings.title === "string" && settings.title.trim()) {
    return settings.title;
  }
  return branding.name;
}