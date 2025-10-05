// Página de resultados de análise climática - criada pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Header } from "~/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Cloud, CheckCircle, AlertCircle, Loader2, TrendingUp, Sparkles, Home } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventProfileService } from "~/lib/services/event-profiles.service";
import { NASADataFetcherService } from "~/lib/services/nasa-data-fetcher.service";
import { WeatherAnalysisService } from "~/lib/services/weather-analysis.service";
import { DateSuggestionsService } from "~/lib/services/date-suggestions.service";
import { ProbabilityFormatterService } from "~/lib/services/probability-formatter.service";
import type { DayAnalysis } from "~/lib/types/weather.types";
import type { Route } from "./+types/results";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resultados - Vai Chover na Minha Parada?" },
    { name: "description", content: "Análise de probabilidades climáticas baseada em dados históricos da NASA" },
  ];
}


export default function Results() {
  const [searchParams] = useSearchParams();

  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const dataInicio = searchParams.get('dataInicio') || '';
  const dataFim = searchParams.get('dataFim') || '';
  const perfilKey = searchParams.get('perfil') || 'praia';
  const locationName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState<DayAnalysis[]>([]);
  const [melhorDia, setMelhorDia] = useState<DayAnalysis | null>(null);
  const [erro, setErro] = useState(false);
  const [sugestoesAlternativas, setSugestoesAlternativas] = useState<DayAnalysis[]>([]);

  const perfil = EventProfileService.getProfile(perfilKey);

  if (!perfil) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto text-center pt-20 p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro: Perfil de evento inválido</h1>
          <p className="text-muted-foreground mb-6">
            O tipo de evento selecionado não foi encontrado.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
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

    try {
      const startDate = new Date(dataInicio);
      const endDate = new Date(dataFim);

      // Fetch historical data using the service
      const fetchResult = await NASADataFetcherService.fetchHistoricalData({
        latitude,
        longitude,
        startDate,
        endDate,
        expansionDays: 30
      });

      const { dataByDay, selectedDays, allDays } = fetchResult;

      // Analyze each day
      const selectedAnalyses: DayAnalysis[] = [];
      const allAnalyses: DayAnalysis[] = [];

      allDays.forEach(day => {
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
      });

      if (selectedAnalyses.length === 0) {
        setErro(true);
        setLoading(false);
        return;
      }

      setResultado(selectedAnalyses);

      // Find best day in selected range
      const bestDay = WeatherAnalysisService.findBestDay(selectedAnalyses);
      setMelhorDia(bestDay);

      // Find alternative suggestions
      const suggestions = DateSuggestionsService.findAlternativeDates(
        allAnalyses,
        selectedAnalyses,
        bestDay,
        startDate,
        { maxSuggestions: 5 }
      );
      setSugestoesAlternativas(suggestions);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };


  if (!latitude || !longitude || !dataInicio || !dataFim) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto text-center pt-20 p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro: Dados insuficientes</h1>
          <p className="text-muted-foreground mb-6">
            Informações necessárias não foram fornecidas. Por favor, retorne e complete todas as etapas.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
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
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Resultados da Análise
              </h1>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground ml-12">
              Probabilidades climáticas baseadas em 20 anos de dados NASA
            </p>
          </div>

          {/* Event Info */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Informações do Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Cloud className="h-4 w-4" />
                    Tipo de Evento
                  </p>
                  <p className="font-semibold text-lg">{perfil.emoji} {perfil.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Período
                  </p>
                  <p className="font-semibold text-sm">
                    {format(new Date(dataInicio), "dd/MM")} - {format(new Date(dataFim), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Coordenadas
                  </p>
                  <p className="font-mono text-xs sm:text-sm">{latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                </div>
                {locationName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Local</p>
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
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium">Analisando 20 anos de dados históricos da NASA...</p>
                  <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
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
                  <h3 className="text-xl font-bold text-destructive">Erro ao buscar dados</h3>
                  <p className="text-muted-foreground">
                    Não foi possível obter os dados climáticos da NASA. Por favor, tente novamente.
                  </p>
                  <Button onClick={buscarDadosHistoricos}>
                    Tentar Novamente
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
                  Melhor Dia do Período
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
                    Probabilidade de Clima Ideal
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Baseado em {melhorDia.totalYears} anos de dados ({melhorDia.idealYears} anos ideais)
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
                  Datas Alternativas Sugeridas
                </CardTitle>
                <CardDescription>
                  Datas próximas (±30 dias) com maior probabilidade de clima ideal
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
                              {textoProximidade} da data selecionada
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {dia.probability.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dia.idealYears} de {dia.totalYears} anos
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
                  Tendência Climática
                </CardTitle>
                <CardDescription>
                  Comparação entre dados recentes e histórico completo
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Últimos 10 anos */}
                <div className="p-6 rounded-lg border-2 border-border bg-muted/50">
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Últimos 10 Anos
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {melhorDia.recentProbability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {melhorDia.idealRecentYears} de {melhorDia.totalRecentYears} anos
                    </div>
                  </div>
                </div>

                {/* 20 anos completos */}
                <div className="p-6 rounded-lg border-2 border-border bg-muted/50">
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Histórico Completo (20 anos)
                    </div>
                    <div className="text-4xl font-bold">
                      {melhorDia.probability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {melhorDia.idealYears} de {melhorDia.totalYears} anos
                    </div>
                  </div>
                </div>
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
                  Todos os Dias do Período
                </CardTitle>
                <CardDescription>
                  Probabilidade de clima ideal para cada dia
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
                              Melhor
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {dia.probability.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dia.idealYears}/{dia.totalYears} anos
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
                  Exemplos de Anos Ideais ({melhorDia.dateStr})
                </CardTitle>
                <CardDescription>Alguns anos com clima ideal nesta data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {melhorDia.details.filter((d: any) => d.ideal).slice(0, 5).map((d: any) => (
                    <div key={d.year} className="p-3 rounded-lg border border-border bg-muted/50 text-center">
                      <div className="font-bold text-lg">{d.year}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {d.temp_min.toFixed(0)}° - {d.temp_max.toFixed(0)}°C
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

        {/* Botão fixo para nova análise */}
        {!loading && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t shadow-lg z-[1000]">
            <div className="max-w-6xl mx-auto flex gap-2">
              <Link to="/" className="flex-1">
                <Button className="w-full h-10">
                  <Home className="h-4 w-4 mr-2" />
                  Nova Análise
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
