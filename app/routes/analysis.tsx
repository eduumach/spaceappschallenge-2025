import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Calendar as CalendarComponent } from "~/components/ui/calendar";
import { Header } from "~/components/header";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ArrowLeft, Calendar, ArrowRight, MousePointer2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "~/lib/utils";
import { EventProfileService } from "~/lib/services/event-profiles.service";
import { useTranslation } from "~/i18n/useTranslation";
import type { Route } from "./+types/analysis";
import type { DateRange } from "react-day-picker";
import { useMemo } from "react";

export function meta({ }: Route.MetaArgs) {
  const { t } = useTranslation('analysis');
  return [
    { title: t('meta.title') },
    { name: "description", content: t('meta.description') },
  ];
}

const STORAGE_KEY = 'spaceapps_analysis_data';
const eventProfiles = EventProfileService.getAllProfiles();

export default function Analysis() {
  const { t, i18n } = useTranslation('analysis');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentLocale = i18n.language === 'en-US' ? enUS : ptBR;

  // Pegar dados da URL ou do localStorage
  const urlLatitude = parseFloat(searchParams.get('lat') || '0');
  const urlLongitude = parseFloat(searchParams.get('lng') || '0');
  const urlLocationName = searchParams.get('name') || '';
  const urlSearchMode = searchParams.get('mode') || 'map';

  const [latitude, setLatitude] = useState(urlLatitude);
  const [longitude, setLongitude] = useState(urlLongitude);
  const [locationName, setLocationName] = useState(urlLocationName);
  const [searchMode, setSearchMode] = useState(urlSearchMode);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [perfilSelecionado, setPerfilSelecionado] = useState('praia');
  const [nomeEventoCustomizado, setNomeEventoCustomizado] = useState('');
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [perfilGerado, setPerfilGerado] = useState<any>(null);
  const [customCriteria, setCustomCriteria] = useState<any>({});

  // Carregar dados do localStorage ao montar o componente
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        // Se não tem dados na URL, usar do localStorage
        if (!urlLatitude && parsed.latitude) {
          setLatitude(parsed.latitude);
        }
        if (!urlLongitude && parsed.longitude) {
          setLongitude(parsed.longitude);
        }
        if (!urlLocationName && parsed.locationName) {
          setLocationName(parsed.locationName);
        }
        if (!urlSearchMode && parsed.searchMode) {
          setSearchMode(parsed.searchMode);
        }

        if (parsed.dateRange) {
          setDateRange({
            from: parsed.dateRange.from ? new Date(parsed.dateRange.from) : undefined,
            to: parsed.dateRange.to ? new Date(parsed.dateRange.to) : undefined,
          });
        }
        if (parsed.perfilSelecionado) {
          setPerfilSelecionado(parsed.perfilSelecionado);
        }
        if (parsed.nomeEventoCustomizado) {
          setNomeEventoCustomizado(parsed.nomeEventoCustomizado);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de análise salvos:', error);
      }
    }
  }, [urlLatitude, urlLongitude, urlLocationName, urlSearchMode]);

  // Salvar dados no localStorage quando mudarem
  useEffect(() => {
    const dataToSave = {
      latitude,
      longitude,
      locationName,
      searchMode,
      dateRange,
      perfilSelecionado,
      nomeEventoCustomizado,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [latitude, longitude, locationName, searchMode, dateRange, perfilSelecionado, nomeEventoCustomizado]);

  useEffect(() => {
    if (perfilSelecionado && eventProfiles[perfilSelecionado]?.criteria) {
      setCustomCriteria(eventProfiles[perfilSelecionado].criteria);
    } else {
      setCustomCriteria({});
    }
  }, [perfilSelecionado]);

  const handleCriteriaChange = (key: string, value: string) => {
    setCustomCriteria((prev: any) => ({
      ...prev,
      [key]: value === '' ? '' : Number(value),
    }));
  };

  if (!latitude || !longitude) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('error.title')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('error.message')}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('error.backButton')}
          </Button>
        </div>
      </div>
    );
  }

  const handleContinueToResults = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert(t('alerts.selectDateRange'));
      return;
    }

    if (perfilSelecionado === 'customizavel' && !nomeEventoCustomizado.trim()) {
      alert(t('alerts.enterCustomEventName'));
      return;
    }

    // Se for customizado, gerar o perfil primeiro
    if (perfilSelecionado === 'customizavel' && nomeEventoCustomizado.trim()) {
      setLoadingPerfil(true);
      try {
        const response = await fetch('/api/generate-event-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventDescription: nomeEventoCustomizado.trim()
          })
        });

        const result = await response.json();

        if (result.success && result.data) {
          // Codificar os dados do perfil gerado em base64 para passar na URL
          const encodedProfile = btoa(JSON.stringify(result.data));
          
          const params = new URLSearchParams({
            lat: latitude.toString(),
            lng: longitude.toString(),
            dataInicio: dateRange.from.toISOString(),
            dataFim: dateRange.to.toISOString(),
            perfil: perfilSelecionado,
            mode: searchMode,
            generatedProfile: encodedProfile
          });

          if (locationName) {
            params.append('name', locationName);
          }

          navigate(`/results?${params.toString()}`);
        } else {
          alert('Erro ao gerar perfil do evento. Tente novamente.');
        }
      } catch (error) {
        console.error('Error generating profile:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
      } finally {
        setLoadingPerfil(false);
      }
    } else {
      // Perfil pré-definido, navegar direto
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        dataInicio: dateRange.from.toISOString(),
        dataFim: dateRange.to.toISOString(),
        perfil: perfilSelecionado,
        mode: searchMode,
      });

      if (locationName) {
        params.append('name', locationName);
      }

      navigate(`/results?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className={`p-4 sm:p-6 ${dateRange?.from && dateRange?.to ? 'pb-24' : ''}`}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {t('header.title')}
              </h1>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground ml-12">
              {t('header.subtitle')}
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5 text-primary" />
                {t('period.title')}
              </CardTitle>
              <CardDescription>
                {t('period.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-base">{t('period.label')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-base h-auto py-3",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd 'de' MMMM", { locale: currentLocale })} -{" "}
                            {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: currentLocale })}
                          </>
                        ) : (
                          format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: currentLocale })
                        )
                      ) : (
                        <span>{t('period.placeholder')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      locale={currentLocale}
                      disabled={(date) => date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer2 className="h-5 w-5 text-primary" />
                {t('eventType.title')}
              </CardTitle>
              <CardDescription>
                {t('eventType.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(eventProfiles).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => setPerfilSelecionado(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${perfilSelecionado === key
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {profile.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {profile.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Campo de input para evento customizado */}
              {perfilSelecionado === 'customizavel' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="custom-event-name" className="text-base">
                    {t('customEvent.label')}
                  </Label>
                  <Input
                    id="custom-event-name"
                    type="text"
                    placeholder={t('customEvent.placeholder')}
                    value={nomeEventoCustomizado}
                    onChange={(e) => setNomeEventoCustomizado(e.target.value)}
                    className="h-12 text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('customEvent.hint')}
                  </p>
                </div>
              )}

              {/* Formulário de critérios do perfil selecionado */}
              {customCriteria && Object.keys(customCriteria).length > 0 && (
                <div className="mt-6">
                  <Label className="text-base mb-2 block">
                    Critérios do evento
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(customCriteria).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <Label htmlFor={`criteria-${key}`} className="mb-1 capitalize">
                          {key.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          id={`criteria-${key}`}
                          type="number"
                          value={value}
                          onChange={e => handleCriteriaChange(key, e.target.value)}
                          className="h-10"
                          placeholder={typeof value === 'number' ? value.toString() : ''}
                          step="any"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Altere os valores para personalizar os critérios deste evento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {dateRange?.from && dateRange?.to && <div className="h-16"></div>}
        </div>

        {dateRange?.from && dateRange?.to && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-lg z-[1000]">
            <div className="max-w-6xl mx-auto flex gap-2">
              <Button
                onClick={handleContinueToResults}
                className="flex-1 h-10"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {t('button.viewProbabilities')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
