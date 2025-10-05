// Página criada pelo Claude Sonnet 4.5
import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/header";
import { MapPicker } from "~/components/map-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { MapPin, Navigation, Search, Trash2, Loader2, Database, Satellite, Calendar, Globe, MapIcon, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Space Apps Challenge 2025 - Seleção de Localização" },
    { name: "description", content: "Selecione uma localização no mapa interativo para o Space Apps Challenge 2025" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'map' | 'name' | 'coordinates'>('map');
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isModalExpanded, setIsModalExpanded] = useState(true);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    // Atualiza os campos de coordenadas quando uma localização é selecionada
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setActiveMethod('map');
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setLocationName("");
    setLatitude("");
    setLongitude("");
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
        // Atualiza os campos de coordenadas
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        setActiveMethod('name');
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

  const handleCoordinateSearch = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Por favor, insira coordenadas válidas');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      alert('Latitude deve estar entre -90 e 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      alert('Longitude deve estar entre -180 e 180');
      return;
    }
    
    setSelectedLocation({ lat, lng });
    setActiveMethod('coordinates');
  };

  const handleCoordinateKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCoordinateSearch();
    }
  };

  const handleContinueToAnalysis = () => {
    if (!selectedLocation) return;
    
    const params = new URLSearchParams({
      lat: selectedLocation.lat.toString(),
      lng: selectedLocation.lng.toString(),
      mode: activeMethod,
    });
    
    if (locationName && activeMethod === 'name') {
      params.append('name', locationName);
    }
    
    navigate(`/analysis?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-neutral-700 to-neutral-500 dark:from-neutral-300 dark:to-neutral-100 bg-clip-text text-transparent">
              Seleção de Localização
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">Use todos os métodos para selecionar um ponto de interesse</p>
          </div>

        <div className="space-y-6">
          
          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="border-b p-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                Busca por Nome
                {activeMethod === 'name' && <Badge variant="default" className="ml-2">Ativo</Badge>}
              </CardTitle>
              <CardDescription className="text-sm">Digite o nome de uma cidade ou endereço</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Input
                  placeholder="Digite um endereço ou local..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-2"
                />
                <Button 
                  className="w-full" 
                  onClick={handleSearch}
                  disabled={isSearching || !locationName.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="border-b p-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                Coordenadas
                {activeMethod === 'coordinates' && <Badge variant="default" className="ml-2">Ativo</Badge>}
              </CardTitle>
              <CardDescription className="text-sm">Insira latitude e longitude diretamente</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Latitude</label>
                    <Input
                      placeholder="-23.5505"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      onKeyPress={handleCoordinateKeyPress}
                      className="border-2"
                      type="number"
                      step="any"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Entre -90 e 90</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Longitude</label>
                    <Input
                      placeholder="-46.6333"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      onKeyPress={handleCoordinateKeyPress}
                      className="border-2"
                      type="number"
                      step="any"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Entre -180 e 180</p>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleCoordinateSearch}
                  disabled={!latitude.trim() || !longitude.trim()}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Definir
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="border-b p-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                Mapa Interativo
                {activeMethod === 'map' && <Badge variant="default" className="ml-2">Ativo</Badge>}
              </CardTitle>
              <CardDescription className="text-sm">Clique no mapa para selecionar</CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-0">
              <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
                <MapPicker onLocationSelect={handleLocationSelect} searchLocation={selectedLocation} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal fixo na direita para localização selecionada */}
        {selectedLocation && (
          <div className={`fixed top-16 right-0 h-[calc(100vh-4rem)] shadow-xl z-40 flex transition-all duration-300 ${
            isModalExpanded ? 'w-80 bg-background border-l' : 'w-12 bg-transparent'
          }`}>
            <div className="flex flex-col justify-start pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalExpanded(!isModalExpanded)}
                className={`h-12 w-12 rounded-l-lg rounded-r-none border border-r-0 hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-md bg-neutral-200 dark:bg-neutral-700 ${
                  isModalExpanded ? '-ml-10' : 'ml-0'
                }`}
              >
                {isModalExpanded ? (
                  <ChevronRight className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                )}
              </Button>
            </div>

            {isModalExpanded && (
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-center">
                    Localização Selecionada
                  </h2>
                  <div className="flex justify-center mt-2">
                    <Badge variant="secondary">
                      {activeMethod === 'map' ? 'Mapa' : activeMethod === 'name' ? 'Nome' : 'Coordenadas'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <div className="text-center space-y-4">
                    <Navigation className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
                    <p className="text-sm text-muted-foreground">
                      Localização definida com sucesso
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t space-y-3">
                  <Button
                    onClick={handleContinueToAnalysis}
                    className="w-full"
                    size="lg"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ir para os Dados
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearSelection}
                    className="w-full"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Seleção
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
