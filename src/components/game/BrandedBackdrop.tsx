import { useBranding } from "@/hooks/useBranding";

export function BrandedBackdrop({ logo = false }: { logo?: boolean }) {
  const { branding } = useBranding();
  return (
    <>
      {branding.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-center bg-cover opacity-15 pointer-events-none z-0"
          style={{ backgroundImage: `url(${branding.backgroundImageUrl})` }}
          aria-hidden="true"
        />
      )}
      {logo && branding.logoUrl && (
        <img
          src={branding.logoUrl}
          alt={branding.name}
          className="absolute top-3 right-3 z-50 h-10 w-10 object-contain drop-shadow-md pointer-events-none"
        />
      )}
    </>
  );
}
