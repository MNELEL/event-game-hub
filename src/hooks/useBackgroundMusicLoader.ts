import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SoundEffects } from "@/hooks/useSoundEffects";

/**
 * Loads the active background music URL from the database on app startup
 * and configures the SoundEffects engine to use it.
 */
export function useBackgroundMusicLoader() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("background_music")
        .select("url")
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      if (data?.url) {
        SoundEffects.setCustomMusicUrl(data.url);
      } else {
        SoundEffects.setCustomMusicUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);
}
