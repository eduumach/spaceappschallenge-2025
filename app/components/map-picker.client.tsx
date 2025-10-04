// Componente client-only criado pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para os ícones padrão do Leaflet
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialPosition?: [number, number];
  searchLocation?: { lat: number; lng: number } | null;
}

function LocationMarker({ onLocationSelect, searchLocation }: { 
  onLocationSelect: (lat: number, lng: number) => void;
  searchLocation?: { lat: number; lng: number } | null;
}) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  // Atualiza a posição quando uma busca é realizada
  useEffect(() => {
    if (searchLocation) {
      const newPosition: [number, number] = [searchLocation.lat, searchLocation.lng];
      setPosition(newPosition);
      map.flyTo(newPosition, 10); // Zoom mais próximo para localização buscada
    }
  }, [searchLocation, map]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export function MapPickerClient({ onLocationSelect, initialPosition = [-15.7801, -47.9292], searchLocation }: MapPickerProps) {
  return (
    <MapContainer
      center={initialPosition}
      zoom={4}
      className="w-full h-full rounded-lg"
      style={{ height: "100%", minHeight: "500px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onLocationSelect={onLocationSelect} searchLocation={searchLocation} />
    </MapContainer>
  );
}
