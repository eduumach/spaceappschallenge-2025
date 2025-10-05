// Página criada pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/header";
import { MapPicker } from "~/components/map-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/toast-provider";
import { useTranslation } from "~/i18n";

import { MapPin, Search, Trash2, Loader2, Globe, ArrowRight } from "lucide-react";
import type { Route } from "./+types/home";

const STORAGE_KEY = 'spaceapps_selected_location';

export function meta({}: Route.MetaArgs) {
  const { t } = useTranslation('home');
  return [
    { title: t("meta.title")},
    { name: "description", content: t("meta.description") },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation('home');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'map' | 'name' | 'coordinates'>('map');
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Carregar dados do localStorage ao montar o componente
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSelectedLocation(parsed.selectedLocation);
        setLocationName(parsed.locationName || "");
        setActiveMethod(parsed.activeMethod || 'map');
        setLatitude(parsed.latitude || "");
        setLongitude(parsed.longitude || "");
      } catch (error) {
        console.error('Erro ao carregar localização salva:', error);
      }
    }
  }, []);

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    if (selectedLocation) {
      const dataToSave = {
        selectedLocation,
        locationName,
        activeMethod,
        latitude,
        longitude,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [selectedLocation, locationName, activeMethod, latitude, longitude]);

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          setLocationName(data.display_name);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar nome da localização:', error);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setLatitude(lat.toString());
    setLongitude(lng.toString());
    setActiveMethod('map');
    fetchLocationName(lat, lng);
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setLocationName("");
    setLatitude("");
    setLongitude("");
    localStorage.removeItem(STORAGE_KEY);
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
        setLatitude(lat.toString());
        setLongitude(lng.toString());
        setActiveMethod('name');
      } else {
        showToast(t('searchByName.notFound'), 'warning');
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      showToast(t('searchByName.error'), 'destructive');
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
      showToast(t('coordinates.invalidCoordinates'), 'warning');
      return;
    }

    if (lat < -90 || lat > 90) {
      showToast(t('coordinates.invalidLatitude'), 'warning');
      return;
    }

    if (lng < -180 || lng > 180) {
      showToast(t('coordinates.invalidLongitude'), 'warning');
      return;
    }

    setSelectedLocation({ lat, lng });
    setActiveMethod('coordinates');
    fetchLocationName(lat, lng);
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className={`p-4 sm:p-6 ${selectedLocation ? 'pb-24' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground px-4">{t('subtitle')}</p>
          </div>

        <div className="space-y-4">
          
          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="border-b p-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4 text-muted-foreground" />
                {t('searchByName.title')}
                {activeMethod === 'name' && <Badge variant="default" className="ml-2 text-xs">{t('searchByName.active')}</Badge>}
              </CardTitle>
              <CardDescription className="text-xs mt-1">{t('searchByName.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                <Input
                  placeholder={t('searchByName.placeholder')}
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-9"
                />
                <Button
                  className="w-full h-9"
                  onClick={handleSearch}
                  disabled={isSearching || !locationName.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isSearching ? t('searchByName.searching') : t('searchByName.button')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 shadow-lg">
            <CardHeader className="border-b p-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {t('coordinates.title')}
                {activeMethod === 'coordinates' && <Badge variant="default" className="ml-2 text-xs">{t('coordinates.active')}</Badge>}
              </CardTitle>
              <CardDescription className="text-xs mt-1">{t('coordinates.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t('coordinates.latitude')}</label>
                    <Input
                      placeholder={t('coordinates.latitudePlaceholder')}
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      onKeyPress={handleCoordinateKeyPress}
                      className="h-9"
                      type="number"
                      step="any"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">{t('coordinates.latitudeRange')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t('coordinates.longitude')}</label>
                    <Input
                      placeholder={t('coordinates.longitudePlaceholder')}
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      onKeyPress={handleCoordinateKeyPress}
                      className="h-9"
                      type="number"
                      step="any"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">{t('coordinates.longitudeRange')}</p>
                  </div>
                </div>
                <Button
                  className="w-full h-9"
                  onClick={handleCoordinateSearch}
                  disabled={!latitude.trim() || !longitude.trim()}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {t('coordinates.button')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-2 shadow-lg p-0">
            <CardHeader className="border-b p-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {t('map.title')}
                {activeMethod === 'map' && <Badge variant="default" className="ml-2 text-xs">{t('map.active')}</Badge>}
              </CardTitle>
              <CardDescription className="text-xs mt-1">{t('map.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] sm:h-[600px] lg:h-[700px]">
                <MapPicker onLocationSelect={handleLocationSelect} searchLocation={selectedLocation} />
              </div>
            </CardContent>
          </Card>

          {selectedLocation && <div className="h-16"></div>}
        </div>

        {selectedLocation && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-lg z-[1000]">
            <div className="max-w-7xl mx-auto flex gap-2">
              <Button
                onClick={handleContinueToAnalysis}
                className="flex-1 h-10"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {t('selectedLocation.continueButton')}
              </Button>
              <Button
                variant="outline"
                className="h-10"
                onClick={handleClearSelection}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
