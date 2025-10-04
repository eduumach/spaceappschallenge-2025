// Página criada pelo Claude Sonnet 4.5
import { useState } from "react";
import { MapPicker } from "~/components/map-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NASADataQueryModal } from "~/components/nasa-data-query-modal";
import { MapPin, Navigation, Search, Trash2, Loader2, Database, Satellite, Calendar } from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Space Apps Challenge 2025 - Seleção de Localização" },
    { name: "description", content: "Selecione uma localização no mapa interativo para o Space Apps Challenge 2025" },
  ];
}

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setLocationName("");
  };

  const handleSearch = async () => {
    if (!locationName.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Erro na busca');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setSelectedLocation({ lat, lng });
      } else {
        alert('Localização não encontrada. Tente com um nome mais específico.');
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      alert('Erro ao buscar localização. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Seleção de Localização
          </h1>
          <p className="text-muted-foreground">Clique no mapa para selecionar um ponto de interesse</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden border-2">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Mapa Interativo
              </CardTitle>
              <CardDescription>Clique em qualquer local para selecionar as coordenadas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <MapPicker onLocationSelect={handleLocationSelect} searchLocation={selectedLocation} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-4 w-4" />
                  Buscar Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Digite um endereço ou local..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-2"
                />
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleSearch}
                  disabled={isSearching || !locationName.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isSearching ? "Buscando..." : "Buscar Localização"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período de Consulta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLocation ? (
                  <>
                    <div className="space-y-3">
                      <NASADataQueryModal 
                        latitude={selectedLocation.lat} 
                        longitude={selectedLocation.lng}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Navigation className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique no mapa para selecionar uma localização
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você poderá consultar dados da NASA após selecionar um ponto
                    </p>
                  </div>
                )}
                
                {selectedLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Seleção
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
