// Página criada pelo Claude Sonnet 4.5
import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPicker } from "~/components/map-picker";
import { MobileNavigation } from "~/components/mobile-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "~/components/ui/navigation-menu";
import { MapPin, Navigation, Search, Trash2, Loader2, Database, Satellite, Calendar, Globe, MapIcon, ArrowRight } from "lucide-react";
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
  const [searchMode, setSearchMode] = useState<'map' | 'name' | 'coordinates'>('map');
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
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
      mode: searchMode,
    });
    
    if (locationName && searchMode === 'name') {
      params.append('name', locationName);
    }
    
    navigate(`/analysis?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Seleção de Localização
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">Escolha como deseja selecionar um ponto de interesse</p>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu className="mx-auto">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`${searchMode === 'map' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    onClick={() => setSearchMode('map')}
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Mapa Interativo
                  </NavigationMenuTrigger>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`${searchMode === 'name' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    onClick={() => setSearchMode('name')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Por Nome
                  </NavigationMenuTrigger>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={`${searchMode === 'coordinates' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    onClick={() => setSearchMode('coordinates')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Coordenadas
                  </NavigationMenuTrigger>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden px-4">
            <MobileNavigation 
              searchMode={searchMode} 
              onSearchModeChange={setSearchMode}
            />
          </div>
        </div>

        <div className="flex justify-center px-4">
          {searchMode === 'map' && (
            <Card className="w-full max-w-4xl overflow-hidden border-2">
              <CardHeader className="border-b p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Mapa Interativo
                </CardTitle>
                <CardDescription className="text-sm">Clique em qualquer local para selecionar as coordenadas</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] sm:h-[450px] lg:h-[600px]">
                  <MapPicker onLocationSelect={handleLocationSelect} searchLocation={selectedLocation} />
                </div>
                {selectedLocation && (
                  <div className="p-3 sm:p-4 border-t bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleContinueToAnalysis}
                        className="flex-1 w-full"
                        size="lg"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Continuar para Análise
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClearSelection}
                        size="lg"
                        className="sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                        <span className="sm:hidden">Limpar</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {searchMode === 'name' && (
            <Card className="w-full max-w-2xl overflow-hidden border-2">
              <CardHeader className="border-b p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Search className="h-5 w-5 text-blue-600" />
                  Busca por Nome
                </CardTitle>
                <CardDescription className="text-sm">Digite o nome de uma cidade ou endereço para localizar</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4">
                  <Input
                    placeholder="Digite um endereço ou local..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border-2 text-base sm:text-lg p-3 sm:p-4"
                  />
                  <Button 
                    className="w-full" 
                    size="lg"
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
                  {selectedLocation && (
                    <>
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm sm:text-base">Localização Encontrada:</h3>
                        <p className="text-green-700 dark:text-green-300 text-xs sm:text-sm break-all">
                          Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleContinueToAnalysis}
                          className="flex-1 w-full"
                          size="lg"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Continuar para Análise
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleClearSelection}
                          size="lg"
                          className="sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Limpar</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {searchMode === 'coordinates' && (
            <Card className="w-full max-w-2xl overflow-hidden border-2">
              <CardHeader className="border-b p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Busca por Coordenadas
                </CardTitle>
                <CardDescription className="text-sm">Insira as coordenadas de latitude e longitude diretamente</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Latitude</label>
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
                      <label className="text-sm font-medium mb-2 block">Longitude</label>
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
                    size="lg"
                    onClick={handleCoordinateSearch}
                    disabled={!latitude.trim() || !longitude.trim()}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Definir Localização
                  </Button>
                  {selectedLocation && (
                    <>
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm sm:text-base">Localização Definida:</h3>
                        <p className="text-green-700 dark:text-green-300 text-xs sm:text-sm break-all">
                          Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleContinueToAnalysis}
                          className="flex-1 w-full"
                          size="lg"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Continuar para Análise
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleClearSelection}
                          size="lg"
                          className="sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                          <span className="sm:hidden">Limpar</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
}
