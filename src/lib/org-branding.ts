export const THEME_PRESET_VALUES = ["CRIMSON", "EMERALD", "COBALT", "AMBER"] as const;

export type ThemePresetValue = (typeof THEME_PRESET_VALUES)[number];

export interface DashboardThemeTokens {
  label: string;
  description: string;
  sidebarBg: string;
  sidebarHoverBg: string;
  sidebarActiveBg: string;
  sidebarActiveBorder: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarActiveIcon: string;
  logoBg: string;
  logoText: string;
  topbarBg: string;
  topbarBorder: string;
  topbarAccent: string;
  topbarMuted: string;
  topbarAvatarBg: string;
  topbarAvatarText: string;
  mainBg: string;
  previewFrom: string;
  previewTo: string;
}

export const DEFAULT_THEME_PRESET: ThemePresetValue = "CRIMSON";

export const DASHBOARD_THEME_PRESETS: Record<ThemePresetValue, DashboardThemeTokens> = {
  CRIMSON: {
    label: "Crimson",
    description: "Warm maroon dashboard chrome close to the current Dominixode look.",
    sidebarBg: "#3D0808",
    sidebarHoverBg: "rgba(255,255,255,0.06)",
    sidebarActiveBg: "rgba(255,255,255,0.10)",
    sidebarActiveBorder: "#d2675b",
    sidebarText: "#FFFFFF",
    sidebarMuted: "rgba(255,255,255,0.68)",
    sidebarActiveIcon: "#f6b28a",
    logoBg: "#a12124",
    logoText: "#FFFFFF",
    topbarBg: "#FFFFFF",
    topbarBorder: "#F0ECEC",
    topbarAccent: "#a12124",
    topbarMuted: "#625f5f",
    topbarAvatarBg: "rgba(161,33,36,0.10)",
    topbarAvatarText: "#a12124",
    mainBg: "#F9F7F6",
    previewFrom: "#5c1313",
    previewTo: "#d07a46",
  },
  EMERALD: {
    label: "Emerald",
    description: "Deep green chrome with a lighter mint accent for active states.",
    sidebarBg: "#0B2E28",
    sidebarHoverBg: "rgba(255,255,255,0.06)",
    sidebarActiveBg: "rgba(255,255,255,0.10)",
    sidebarActiveBorder: "#46b49c",
    sidebarText: "#FFFFFF",
    sidebarMuted: "rgba(255,255,255,0.70)",
    sidebarActiveIcon: "#86e1c6",
    logoBg: "#157A6E",
    logoText: "#FFFFFF",
    topbarBg: "#FFFFFF",
    topbarBorder: "#E8EFED",
    topbarAccent: "#157A6E",
    topbarMuted: "#5D706B",
    topbarAvatarBg: "rgba(21,122,110,0.12)",
    topbarAvatarText: "#157A6E",
    mainBg: "#F4F8F6",
    previewFrom: "#0f433b",
    previewTo: "#46b49c",
  },
  COBALT: {
    label: "Cobalt",
    description: "Structured navy-and-cobalt shell for a sharper academic theme.",
    sidebarBg: "#13233E",
    sidebarHoverBg: "rgba(255,255,255,0.06)",
    sidebarActiveBg: "rgba(255,255,255,0.10)",
    sidebarActiveBorder: "#5f96ff",
    sidebarText: "#FFFFFF",
    sidebarMuted: "rgba(255,255,255,0.70)",
    sidebarActiveIcon: "#a7c4ff",
    logoBg: "#2857B8",
    logoText: "#FFFFFF",
    topbarBg: "#FFFFFF",
    topbarBorder: "#E7ECF7",
    topbarAccent: "#2857B8",
    topbarMuted: "#5B657A",
    topbarAvatarBg: "rgba(40,87,184,0.12)",
    topbarAvatarText: "#2857B8",
    mainBg: "#F5F7FB",
    previewFrom: "#17315a",
    previewTo: "#4f86ff",
  },
  AMBER: {
    label: "Amber",
    description: "Dark bronze shell with warm amber highlights.",
    sidebarBg: "#3D230E",
    sidebarHoverBg: "rgba(255,255,255,0.06)",
    sidebarActiveBg: "rgba(255,255,255,0.10)",
    sidebarActiveBorder: "#e1a449",
    sidebarText: "#FFFFFF",
    sidebarMuted: "rgba(255,255,255,0.72)",
    sidebarActiveIcon: "#ffd18e",
    logoBg: "#B06A1F",
    logoText: "#FFFFFF",
    topbarBg: "#FFFFFF",
    topbarBorder: "#F2E7DA",
    topbarAccent: "#B06A1F",
    topbarMuted: "#756255",
    topbarAvatarBg: "rgba(176,106,31,0.12)",
    topbarAvatarText: "#B06A1F",
    mainBg: "#FBF6F0",
    previewFrom: "#5a3213",
    previewTo: "#d89a42",
  },
};

export const DASHBOARD_THEME_OPTIONS = THEME_PRESET_VALUES.map((preset) => ({
  value: preset,
  label: DASHBOARD_THEME_PRESETS[preset].label,
  description: DASHBOARD_THEME_PRESETS[preset].description,
  previewFrom: DASHBOARD_THEME_PRESETS[preset].previewFrom,
  previewTo: DASHBOARD_THEME_PRESETS[preset].previewTo,
}));

export function isThemePreset(value: unknown): value is ThemePresetValue {
  return typeof value === "string" && THEME_PRESET_VALUES.includes(value as ThemePresetValue);
}

export function getDashboardThemeTokens(preset?: ThemePresetValue | null) {
  if (!preset || !isThemePreset(preset)) {
    return DASHBOARD_THEME_PRESETS[DEFAULT_THEME_PRESET];
  }

  return DASHBOARD_THEME_PRESETS[preset];
}

export function getDashboardThemeCssVariables(preset?: ThemePresetValue | null) {
  const tokens = getDashboardThemeTokens(preset);

  return {
    "--dashboard-sidebar-bg": tokens.sidebarBg,
    "--dashboard-sidebar-hover-bg": tokens.sidebarHoverBg,
    "--dashboard-sidebar-active-bg": tokens.sidebarActiveBg,
    "--dashboard-sidebar-active-border": tokens.sidebarActiveBorder,
    "--dashboard-sidebar-text": tokens.sidebarText,
    "--dashboard-sidebar-muted": tokens.sidebarMuted,
    "--dashboard-sidebar-active-icon": tokens.sidebarActiveIcon,
    "--dashboard-logo-bg": tokens.logoBg,
    "--dashboard-logo-text": tokens.logoText,
    "--dashboard-topbar-bg": tokens.topbarBg,
    "--dashboard-topbar-border": tokens.topbarBorder,
    "--dashboard-topbar-accent": tokens.topbarAccent,
    "--dashboard-topbar-muted": tokens.topbarMuted,
    "--dashboard-topbar-avatar-bg": tokens.topbarAvatarBg,
    "--dashboard-topbar-avatar-text": tokens.topbarAvatarText,
    "--dashboard-main-bg": tokens.mainBg,
  } as Record<string, string>;
}
