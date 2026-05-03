import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { branding as defaults } from "@/config/branding";

export type BrandingValues = {
  name: string;
  fullName: string;
  shortName: string;
  phone: string;
  iconPrimary: string;
  iconFestive: string;
  tagline: string;
  heroSubtitle: string;
  aboutDescription: string;
  lobbySubtitle: string;
  logoUrl: string;
  heroImageUrl: string;
  backgroundImageUrl: string;
};

const fallback: BrandingValues = {
  name: defaults.name,
  fullName: defaults.fullName,
  shortName: defaults.shortName,
  phone: defaults.contact.phone,
  iconPrimary: defaults.icons.primary,
  iconFestive: defaults.icons.festive,
  tagline: defaults.copy.tagline,
  heroSubtitle: defaults.copy.heroSubtitle,
  aboutDescription: defaults.copy.aboutDescription,
  lobbySubtitle: defaults.copy.lobbySubtitle,
  logoUrl: "",
  heroImageUrl: "",
  backgroundImageUrl: "",
};

type Ctx = {
  branding: BrandingValues;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (values: BrandingValues) => Promise<{ error: string | null }>;
};

const BrandingContext = createContext<Ctx>({
  branding: fallback,
  loading: false,
  refresh: async () => {},
  save: async () => ({ error: null }),
});

function rowToValues(row: any): BrandingValues {
  return {
    name: row.name ?? fallback.name,
    fullName: row.full_name ?? fallback.fullName,
    shortName: row.short_name ?? fallback.shortName,
    phone: row.phone ?? fallback.phone,
    iconPrimary: row.icon_primary ?? fallback.iconPrimary,
    iconFestive: row.icon_festive ?? fallback.iconFestive,
    tagline: row.tagline ?? fallback.tagline,
    heroSubtitle: row.hero_subtitle ?? fallback.heroSubtitle,
    aboutDescription: row.about_description ?? fallback.aboutDescription,
    lobbySubtitle: row.lobby_subtitle ?? fallback.lobbySubtitle,
    logoUrl: row.logo_url ?? "",
    heroImageUrl: row.hero_image_url ?? "",
    backgroundImageUrl: row.background_image_url ?? "",
  };
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<BrandingValues>(() => {
    try {
      const cached = localStorage.getItem("branding_cache");
      if (cached) return { ...fallback, ...JSON.parse(cached) };
    } catch {}
    return fallback;
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("branding")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    if (data) {
      const v = rowToValues(data);
      setValues(v);
      try { localStorage.setItem("branding_cache", JSON.stringify(v)); } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (v: BrandingValues) => {
    const { error } = await (supabase as any)
      .from("branding")
      .update({
        name: v.name,
        full_name: v.fullName,
        short_name: v.shortName,
        phone: v.phone,
        icon_primary: v.iconPrimary,
        icon_festive: v.iconFestive,
        tagline: v.tagline,
        hero_subtitle: v.heroSubtitle,
        about_description: v.aboutDescription,
        lobby_subtitle: v.lobbySubtitle,
        logo_url: v.logoUrl || null,
        hero_image_url: v.heroImageUrl || null,
        background_image_url: v.backgroundImageUrl || null,
      })
      .eq("is_active", true);
    if (error) return { error: error.message };
    setValues(v);
    try { localStorage.setItem("branding_cache", JSON.stringify(v)); } catch {}
    return { error: null };
  }, []);

  return (
    <BrandingContext.Provider value={{ branding: values, loading, refresh: load, save }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
