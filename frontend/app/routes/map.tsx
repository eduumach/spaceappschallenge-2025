// Página criada pelo Claude Sonnet 4.5
import { useState } from "react";
import { MapPicker } from "~/components/map-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MapPin, Navigation, Search, Trash2 } from "lucide-react";

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setLocationName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Seleção de Localização
          </h1>
          <p className="text-muted-foreground">Clique no mapa para selecionar um ponto de interesse</p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <Card className="lg:col-span-2 overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Mapa Interativo
              </CardTitle>
              <CardDescription>Clique em qualquer local para selecionar as coordenadas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <MapPicker onLocationSelect={handleLocationSelect} />
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Search Card */}
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
                  className="border-2"
                />
                <Button className="w-full" variant="outline" disabled>
                  <Navigation className="h-4 w-4 mr-2" />
                  Buscar (Em breve)
                </Button>
              </CardContent>
            </Card>

            {/* Selected Location Card */}
            <Card className={`border-2 transition-all ${selectedLocation ? "border-blue-500 shadow-lg" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-4 w-4" />
                  Localização Selecionada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLocation ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                          <p className="text-lg font-mono font-semibold">{selectedLocation.lat.toFixed(6)}</p>
                        </div>
                        <Badge variant="secondary">N/S</Badge>
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                          <p className="text-lg font-mono font-semibold">{selectedLocation.lng.toFixed(6)}</p>
                        </div>
                        <Badge variant="secondary">E/W</Badge>
                      </div>

                      <div className="pt-2 space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Coordenadas Completas</p>
                        <div className="p-3 bg-muted rounded-md">
                          <code className="text-xs">
                            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                        <MapPin className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleClearSelection}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Nenhum ponto selecionado</p>
                    <p className="text-xs text-muted-foreground">Clique no mapa para selecionar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zoom</span>
                  <Badge variant="outline">4x</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Projeção</span>
                  <Badge variant="outline">Web Mercator</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fonte</span>
                  <Badge variant="outline">OpenStreetMap</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
