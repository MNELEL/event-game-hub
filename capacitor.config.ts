import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.da95ce758d7a4902b98e2598818d5a75',
  appName: 'מגה מוח',
  webDir: 'dist',
  // ✅ אין server.url → האפליקציה טוענת מ-dist המקומי = עובד offline
  android: {
    allowMixedContent: true, // מאפשר קריאות HTTPS ל-Supabase כשיש אינטרנט
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
