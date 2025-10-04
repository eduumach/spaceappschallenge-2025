// Componente criado pelo Claude Sonnet 4.5
import { useEffect, useState } from "react";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: [number, number];
  searchLocation?: { lat: number; lng: number } | null;
}

export function MapPicker({ onLocationSelect, initialPosition = [-15.7801, -47.9292], searchLocation }: MapPickerProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapPickerProps> | null>(null);

  useEffect(() => {
    // Só importa o mapa no cliente
    import("./map-picker.client").then((mod) => {
      setMapComponent(() => mod.MapPickerClient);
    });
    
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg" style={{ minHeight: "500px" }}>
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  return <MapComponent onLocationSelect={onLocationSelect} initialPosition={initialPosition} searchLocation={searchLocation} />;
}
