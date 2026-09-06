const LABELS: Record<string, string> = {
  "avatar.thinking": "thinking",
  "avatar.replying": "replying",
  "avatar.talking": "talking",
  "avatar.inChat": "in chat",
  "avatar.coffeeBreak": "coffee",
  "avatar.inLine": "in line",
  "avatar.moving": "moving",
  "avatar.available": "available",
  "zones.hotspotFocus": "Focus {{label}}",
  "zones.living": "Living",
  "zones.centerDesk": "Center desk",
  "zones.cafeteria": "Cafeteria",
  "zones.wallDesks": "Wall desks",
};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`,
  );
}

export function useTranslation() {
  return {
    t: (key: string, params?: Record<string, string | number>) =>
      interpolate(LABELS[key] ?? key, params),
    locale: "en" as const,
  };
}
