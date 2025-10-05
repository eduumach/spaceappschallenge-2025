// Página de resultados de análise climática - criada pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router";
import { Header } from "~/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { ArrowLeft, MapPin, Calendar, Cloud, CheckCircle, AlertCircle, TrendingUp, Sparkles, RefreshCw, Share2, Thermometer } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { CRITERIA_KEYS, EventProfileService } from "~/lib/services/event-profiles.service";
import { NASADataFetcherService } from "~/lib/services/nasa-data-fetcher.service";
import { WeatherAnalysisService } from "~/lib/services/weather-analysis.service";
import { DateSuggestionsService } from "~/lib/services/date-suggestions.service";
import { ProbabilityFormatterService } from "~/lib/services/probability-formatter.service";
import { useTranslation } from "~/i18n/useTranslation";
import { useToast } from "~/components/toast-provider";
import { formatTemperature, type TemperatureUnit } from "~/lib/utils/temperature";
import type { DayAnalysis, EventCriteria, EventProfile } from "~/lib/types/weather.types";
import type { Route } from "./+types/results";

export function meta({}: Route.MetaArgs) {
  const { t } = useTranslation('results');
  return [
    { title: t('meta.title') },
    { name: "description", content: t('meta.description') },
  ];
}


export default function Results() {
  const { t, i18n } = useTranslation('results');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const location = useLocation();

  // Temperature unit based on user's language preference
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    i18n.language === 'en-US' ? 'fahrenheit' : 'celsius'
  );

  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const dataInicio = searchParams.get('dataInicio') || '';
  const dataFim = searchParams.get('dataFim') || '';
  const perfilKey = searchParams.get('perfil') || 'praia';
  const locationName = searchParams.get('name') || '';
  const hourParam = searchParams.get('hour');
  const hour = hourParam ? parseInt(hourParam) : undefined;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<DayAnalysis[]>([]);
  const [melhorDia, setMelhorDia] = useState<DayAnalysis | null>(null);
  const [erro, setErro] = useState(false);
  const [sugestoesAlternativas, setSugestoesAlternativas] = useState<DayAnalysis[]>([]);
  
  // Decode and use the generated profile if available
  let perfil = EventProfileService.getProfile(perfilKey) ?? EventProfileService.getProfile("custom") as EventProfile; // custom nunca vai ser null
  CRITERIA_KEYS.forEach(key => {
    const params = new URLSearchParams(location.search);
    if (params.has(key)) {
      const value = parseFloat(params.get(key) ?? "");
      if (!isNaN(value)) {
        perfil.criteria[key as keyof EventCriteria] = value
      } 
    }
  })

  // console.log(perfil)
  if (!perfil) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto text-center pt-20 p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('errors.invalidProfile.title')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('errors.invalidProfile.message')}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('errors.invalidProfile.backButton')}
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (latitude && longitude && dataInicio && dataFim) {
      buscarDadosHistoricos();
    }
  }, [latitude, longitude, dataInicio, dataFim]);

  const buscarDadosHistoricos = async () => {
    setLoading(true);
    setErro(false);
    setProgress(0);

    try {
      const startDate = new Date(dataInicio);
      const endDate = new Date(dataFim);

      // Step 1: Fetch historical data (0-60%)
      setProgress(5);
      const fetchResult = await NASADataFetcherService.fetchHistoricalData({
        latitude,
        longitude,
        startDate,
        endDate,
        expansionDays: 30,
        hour, // Pass the hour parameter for hourly data
        onProgress: (completed, total) => {
          // Update progress from 5% to 60% based on completed requests
          const progressPercent = 5 + Math.floor((completed / total) * 55);
          setProgress(progressPercent);
        }
      });
      setProgress(60);

      const { dataByDay, selectedDays, allDays } = fetchResult;

      // Step 2: Analyze each day (60-80%)
      const selectedAnalyses: DayAnalysis[] = [];
      const allAnalyses: DayAnalysis[] = [];
      const totalDays = allDays.length;

      allDays.forEach((day, index) => {
        const dayKey = `${(day.getMonth() + 1).toString().padStart(2, '0')}${day.getDate().toString().padStart(2, '0')}`;
        const historicalData = dataByDay.get(dayKey) || [];

        if (historicalData.length > 0) {
          const analysis = WeatherAnalysisService.analyzeDay(
            historicalData,
            day,
            perfil.criteria
          );
          allAnalyses.push(analysis);

          // Check if day is in selected range
          if (NASADataFetcherService.isDateInRange(day, selectedDays)) {
            selectedAnalyses.push(analysis);
          }
        }

        // Update progress for each day analyzed
        setProgress(60 + Math.floor((index / totalDays) * 20));
      });
      setProgress(80);

      if (selectedAnalyses.length === 0) {
        setErro(true);
        setLoading(false);
        return;
      }

      setResultado(selectedAnalyses);

      // Step 3: Find best day (80-90%)
      setProgress(85);
      const bestDay = WeatherAnalysisService.findBestDay(selectedAnalyses);
      setMelhorDia(bestDay);
      setProgress(90);

      // Step 4: Find alternative suggestions (90-100%)
      const suggestions = DateSuggestionsService.findAlternativeDates(
        allAnalyses,
        selectedAnalyses,
        bestDay,
        startDate,
        { maxSuggestions: 5 }
      );
      setSugestoesAlternativas(suggestions);
      setProgress(100);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: t('share.title'),
      text: t('share.message', {
        eventName: perfil.name,
        location: locationName || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      }),
      url: currentUrl
    };

    try {
      // Try to use Web Share API if available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(currentUrl);
        showToast(t('share.copied'), 'success');
      }
    } catch (error) {
      // If user cancels share or any other error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        showToast(t('share.error'), 'destructive');
      }
    }
  };

  if (!latitude || !longitude || !dataInicio || !dataFim) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto text-center pt-20 p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('errors.insufficientData.title')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('errors.insufficientData.message')}
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('errors.insufficientData.backButton')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('header.title')}
              </h1>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground ml-12">
              {t('header.subtitle')}
            </p>
          </div>

          {/* Event Info */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('eventInfo.title')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemperatureUnit(prev => prev === 'celsius' ? 'fahrenheit' : 'celsius')}
                  className="flex items-center gap-1.5"
                  title={t('temperature.toggle')}
                >
                  <Thermometer className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {temperatureUnit === 'celsius' ? '°C' : '°F'}
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Cloud className="h-4 w-4" />
                    {t('eventInfo.eventType')}
                  </p>
                  <p className="font-semibold text-lg">{perfil.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {t('eventInfo.period')}
                  </p>
                  <p className="font-semibold text-sm">
                    {format(new Date(dataInicio), "dd/MM")} - {format(new Date(dataFim), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {t('eventInfo.coordinates')}
                  </p>
                  <p className="font-mono text-xs sm:text-sm">{latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                </div>
                {locationName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('eventInfo.location')}</p>
                    <p className="font-semibold truncate">{locationName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card className="border-2 shadow-lg">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <p className="text-lg font-medium">{t('loading.analyzing')}</p>
                  <div className="w-full max-w-md space-y-2">
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{t('loading.wait')}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {erro && !loading && (
            <Card className="border-2 border-destructive shadow-lg">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <h3 className="text-xl font-bold text-destructive">{t('errors.fetchError.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('errors.fetchError.message')}
                  </p>
                  <Button onClick={buscarDadosHistoricos}>
                    {t('errors.fetchError.retryButton')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Melhor Dia - Destaque */}
          {melhorDia && !loading && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center text-sm font-medium text-muted-foreground">
                  {t('bestDay.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-center space-y-4">
                  <div className="text-3xl sm:text-4xl font-bold">
                    {melhorDia.dateStr}
                  </div>
                  <div className="text-5xl sm:text-6xl font-bold text-primary">
                    {melhorDia.probability.toFixed(1)}%
                  </div>
                  <div className="text-base sm:text-lg text-muted-foreground">
                    {t('bestDay.probability')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('bestDay.basedOn', { years: melhorDia.totalYears, idealYears: melhorDia.idealYears })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sugestões de Datas Alternativas */}
          {sugestoesAlternativas.length > 0 && !loading && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('alternatives.title')}
                </CardTitle>
                <CardDescription>
                  {t('alternatives.description')}
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sugestoesAlternativas.map((dia, index) => {
                  const diferencaDias = DateSuggestionsService.calculateDaysDifference(dia.date, new Date(dataInicio));
                  const textoProximidade = DateSuggestionsService.getProximityText(diferencaDias);

                  return (
                    <div
                      key={dia.dateStr}
                      className="p-4 rounded-lg border-2 border-border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xl text-muted-foreground">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-lg">{dia.dateStr}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('alternatives.proximity', { text: textoProximidade })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {dia.probability.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('alternatives.yearsData', { idealYears: dia.idealYears, totalYears: dia.totalYears })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

          {/* Análise Comparativa: Últimos 10 vs 20 Anos */}
          {melhorDia && !loading && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('trend.title')}
                </CardTitle>
                <CardDescription>
                  {t('trend.description')}
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Últimos 10 anos */}
                <div className="p-6 rounded-lg border-2 border-border bg-muted/50">
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      {t('trend.recent10Years')}
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {melhorDia.recentProbability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('trend.yearsCount', { idealYears: melhorDia.idealRecentYears, totalYears: melhorDia.totalRecentYears })}
                    </div>
                  </div>
                </div>

                {/* 20 anos completos */}
                <div className="p-6 rounded-lg border-2 border-border bg-muted/50">
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      {t('trend.fullHistory')}
                    </div>
                    <div className="text-4xl font-bold">
                      {melhorDia.probability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('trend.yearsCount', { idealYears: melhorDia.idealYears, totalYears: melhorDia.totalYears })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion explicando as porcentagens */}
              <div className="mt-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="methodology">
                    <AccordionTrigger className="text-sm">
                      {t('methodology.title')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          {t('methodology.intro')}
                        </p>

                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="font-semibold text-foreground mb-1">
                              {t('methodology.recent10Years.title', { years: melhorDia.totalRecentYears })}
                            </div>
                            <p className="text-xs">
                              {t('methodology.recent10Years.description', {
                                startYear: 2025 - 10,
                                totalYears: melhorDia.totalRecentYears,
                                idealYears: melhorDia.idealRecentYears,
                                probability: melhorDia.recentProbability.toFixed(1)
                              })}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="font-semibold text-foreground mb-1">
                              {t('methodology.fullHistory.title', { years: melhorDia.totalYears })}
                            </div>
                            <p className="text-xs">
                              {t('methodology.fullHistory.description', {
                                totalYears: melhorDia.totalYears,
                                idealYears: melhorDia.idealYears,
                                probability: melhorDia.probability.toFixed(1)
                              })}
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="font-semibold text-foreground mb-1">{t('methodology.criteria.title')}</div>
                            <div className="text-xs space-y-1">
                              <p>{t('methodology.criteria.description')}</p>
                              <ul className="list-disc list-inside ml-2 space-y-1">
                                {Object.entries(perfil.criteria).map(([key, value]: [string, any]) => {
                                  const criteriaLabels: Record<string, { unit: string; isTemp?: boolean }> = {
                                    temp_min_ideal: { unit: '°C', isTemp: true },
                                    temp_max_ideal: { unit: '°C', isTemp: true },
                                    precipitation_max: { unit: 'mm' },
                                    wind_max: { unit: 'km/h' },
                                    humidity_min: { unit: '%' },
                                    humidity_max: { unit: '%' },
                                  };

                                  const { unit, isTemp } = criteriaLabels[key] || { unit: '' };
                                  const label = t(`methodology.criteria.labels.${key}`, { defaultValue: key });
                                  const isMin = key.includes('_min');
                                  const isMax = key.includes('_max');
                                  const minMaxLabel = isMin
                                    ? t('methodology.criteria.minLabel')
                                    : isMax
                                      ? t('methodology.criteria.maxLabel')
                                      : '';

                                  // Format temperature value if it's a temperature criterion
                                  const displayValue = isTemp
                                    ? formatTemperature(value, temperatureUnit)
                                    : `${value}${unit}`;

                                  return (
                                    <li key={key}>
                                      <span className="font-medium">{label}</span>: {minMaxLabel} {displayValue}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="font-semibold text-foreground mb-1">{t('methodology.whyTwo.title')}</div>
                            <p className="text-xs">
                              {t('methodology.whyTwo.description')}
                            </p>
                            <ul className="list-disc list-inside ml-2 space-y-1 text-xs mt-2">
                              <li>{t('methodology.whyTwo.recent')}</li>
                              <li>{t('methodology.whyTwo.full')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Comparação de Dias */}
          {resultado.length > 0 && !loading && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t('comparison.title')}
                </CardTitle>
                <CardDescription>
                  {t('comparison.description')}
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resultado.map((dia) => (
                  <div
                    key={dia.dateStr}
                    className={`p-3 rounded-lg border transition-all ${
                      dia === melhorDia
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold">{dia.dateStr}</div>
                          {dia === melhorDia && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {t('comparison.bestBadge')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {dia.probability.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('comparison.yearsFormat', { idealYears: dia.idealYears, totalYears: dia.totalYears })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

          {/* Detalhes do Melhor Dia - Simplificado */}
          {melhorDia && !loading && melhorDia.idealYears > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  {t('idealYears.title', { date: melhorDia.dateStr })}
                </CardTitle>
                <CardDescription>{t('idealYears.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {melhorDia.details.filter((d: any) => d.ideal).slice(0, 5).map((d: any) => (
                    <div key={d.year} className="p-3 rounded-lg border border-border bg-muted/50 text-center">
                      <div className="font-bold text-lg">{d.year}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTemperature(d.temp_min, temperatureUnit)} - {formatTemperature(d.temp_max, temperatureUnit)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spacer para o botão fixo */}
          {!loading && <div className="h-16"></div>}
        </div>

        {/* Botões fixos */}
        {!loading && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-lg z-[1000]">
            <div className="max-w-6xl mx-auto flex gap-2">
              <Button variant="outline" className="h-10" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('buttons.editAnalysis')}
              </Button>
              <Button variant="outline" className="h-10" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                {t('buttons.share')}
              </Button>
              <Link to="/" className="flex-1">
                <Button className="w-full h-10">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('buttons.newAnalysis')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
