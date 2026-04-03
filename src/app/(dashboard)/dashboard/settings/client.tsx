"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DASHBOARD_THEME_OPTIONS,
  getDashboardThemeTokens,
  type ThemePresetValue,
} from "@/lib/org-branding";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "@/lib/api/org-settings";

export default function SettingsClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orgId = session?.user?.orgId;
  const isReadOnly = session?.user?.officerAccessRole !== "TREASURER";

  const { data, isLoading } = useQuery({
    queryKey: ["org-settings", orgId],
    enabled: !!orgId,
    queryFn: () => getOrganizationSettings(orgId as string),
  });

  const [displayName, setDisplayName] = useState("");
  const [themePreset, setThemePreset] = useState<ThemePresetValue>("CRIMSON");

  useEffect(() => {
    if (!data) {
      return;
    }

    setDisplayName(data.displayName);
    setThemePreset(data.themePreset);
  }, [data]);

  const selectedTheme = useMemo(() => getDashboardThemeTokens(themePreset), [themePreset]);
  const hasChanges =
    displayName.trim() !== (data?.displayName ?? "").trim() ||
    themePreset !== (data?.themePreset ?? "CRIMSON");

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOrganizationSettings(orgId as string, {
        displayName,
        themePreset,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["org-settings", orgId] });
      router.refresh();
      toast.success("Organization settings updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save organization settings.");
    },
  });

  if (!orgId) {
    return (
      <div className="rounded-3xl border border-[#ede6df] bg-white p-8 shadow-sm">
        <h2 className="font-display text-3xl font-bold text-[#343434]">Organization Settings</h2>
        <p className="mt-2 text-sm text-[#625f5f]">Organization context is missing for this account.</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[140px] w-full rounded-[28px]" />
        <Skeleton className="h-[420px] w-full rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[28px] border border-[#eadfd5] bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b8883]">
              Dashboard Branding
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#343434]">Organization Settings</h2>
            <p className="mt-2 text-sm leading-6 text-[#625f5f]">
              Change the displayed organization name and the dashboard shell theme for this organization. The internal
              org key stays unchanged.
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-[#efe4da] bg-[#faf7f3] px-5 py-4 text-sm text-[#5f5350]">
            <p>
              <span className="font-semibold text-[#342928]">Internal org key:</span> {orgId}
            </p>
            <p>
              <span className="font-semibold text-[#342928]">Access:</span>{" "}
              {isReadOnly ? "President (read-only)" : "Treasurer"}
            </p>
            <p>
              <span className="font-semibold text-[#342928]">Fallback state:</span>{" "}
              {data.isFallback ? "Using defaults until saved" : "Saved settings active"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-[#eadfd5] bg-white p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <label htmlFor="org-display-name" className="text-sm font-semibold text-[#342928]">
                Display name
              </label>
              <input
                id="org-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isReadOnly}
                className="mt-2 w-full rounded-2xl border border-[#dfd6cf] bg-[#fcfaf8] px-4 py-3 text-sm text-[#241f1f] outline-none transition focus:border-[#c9b7af] focus:ring-2 focus:ring-[#eadfd5] disabled:cursor-not-allowed disabled:bg-[#f5f1ed] disabled:text-[#8b7c76]"
                placeholder="Organization display name"
                maxLength={60}
              />
              <p className="mt-2 text-xs text-[#746865]">
                This is what officers and students see in the dashboard, portal, and exported report headers.
              </p>
            </div>

            <div>
              <div className="mb-3">
                <p className="text-sm font-semibold text-[#342928]">Dashboard theme preset</p>
                <p className="mt-1 text-xs text-[#746865]">
                  Theme presets currently style the dashboard shell only. Portal and print/export branding stay
                  unchanged in this phase.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {DASHBOARD_THEME_OPTIONS.map((option) => {
                  const isSelected = option.value === themePreset;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => setThemePreset(option.value)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        isSelected
                          ? "border-[#c87d64] bg-[#fff8f4] shadow-[0_10px_30px_rgba(70,35,22,0.08)]"
                          : "border-[#eadfd5] bg-white hover:border-[#d9c9be]"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      <div
                        className="h-20 rounded-[18px]"
                        style={{
                          background: `linear-gradient(135deg, ${option.previewFrom} 0%, ${option.previewTo} 100%)`,
                        }}
                      />
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#342928]">{option.label}</p>
                          <p className="mt-1 text-xs leading-5 text-[#746865]">{option.description}</p>
                        </div>
                        {isSelected ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#8f1c20] text-white">
                            <Icon icon="solar:check-circle-bold" className="h-5 w-5" />
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#efe4da] pt-6">
              {isReadOnly ? (
                <p className="mr-auto text-xs text-[#746865]">Only the treasurer can update organization settings.</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setDisplayName(data.displayName);
                  setThemePreset(data.themePreset);
                }}
                disabled={isReadOnly || !hasChanges || saveMutation.isPending}
                className="rounded-full border border-[#ddcfc7] px-4 py-2 text-sm font-medium text-[#5d504d] transition hover:bg-[#faf5f0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={isReadOnly || !hasChanges || saveMutation.isPending || displayName.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-full bg-[#8f1c20] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#761619] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveMutation.isPending ? (
                  <Icon icon="solar:spinner-bold" className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon icon="solar:diskette-bold" className="h-4 w-4" />
                )}
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#eadfd5] bg-white p-8 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-semibold text-[#342928]">Preview</p>
            <p className="mt-1 text-xs text-[#746865]">
              This preview reflects the selected dashboard shell colors before saving.
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#e6ddd5] bg-[#fcfaf8]">
            <div
              className="flex min-h-[320px]"
              style={
                {
                  "--preview-sidebar-bg": selectedTheme.sidebarBg,
                  "--preview-active-bg": selectedTheme.sidebarActiveBg,
                  "--preview-active-border": selectedTheme.sidebarActiveBorder,
                  "--preview-text": selectedTheme.sidebarText,
                  "--preview-muted": selectedTheme.sidebarMuted,
                  "--preview-logo-bg": selectedTheme.logoBg,
                  "--preview-topbar-bg": selectedTheme.topbarBg,
                  "--preview-topbar-border": selectedTheme.topbarBorder,
                  "--preview-topbar-accent": selectedTheme.topbarAccent,
                  "--preview-topbar-muted": selectedTheme.topbarMuted,
                  "--preview-main-bg": selectedTheme.mainBg,
                } as CSSProperties
              }
            >
              <div className="w-[148px] bg-[var(--preview-sidebar-bg)] px-4 py-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--preview-logo-bg)] text-sm font-bold text-white">
                    DF
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--preview-text)]">
                      DominiFunds
                    </p>
                    <p className="truncate text-[11px] text-[var(--preview-muted)]">{displayName.trim() || data.displayName}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  {["Dashboard", "Members", "Settings"].map((label, index) => (
                    <div
                      key={label}
                      className={`rounded-r-lg px-3 py-2 text-xs ${
                        index === 2
                          ? "border-l-[3px] border-[var(--preview-active-border)] bg-[var(--preview-active-bg)] font-semibold text-[var(--preview-text)]"
                          : "text-[var(--preview-muted)]"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col bg-[var(--preview-main-bg)]">
                <div
                  className="flex h-12 items-center justify-between border-b px-4"
                  style={{
                    backgroundColor: "var(--preview-topbar-bg)",
                    borderColor: "var(--preview-topbar-border)",
                  }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#342928]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--preview-topbar-accent)" }} />
                    Settings
                  </div>
                  <span className="text-xs" style={{ color: "var(--preview-topbar-muted)" }}>
                    {displayName.trim() || data.displayName}
                  </span>
                </div>

                <div className="flex-1 p-5">
                  <div className="rounded-[20px] border border-white/80 bg-white/85 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8e817c]">Preview</p>
                    <p className="mt-2 text-lg font-semibold text-[#342928]">{selectedTheme.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[#625f5f]">{selectedTheme.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
