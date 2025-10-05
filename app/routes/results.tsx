// Página de resultados de análise climática - criada pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Cloud, CheckCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react";
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
  const customEventName = searchParams.get('customEventName') || '';

  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState<DayAnalysis[]>([]);
  const [melhorDia, setMelhorDia] = useState<DayAnalysis | null>(null);
  const [erro, setErro] = useState(false);
  const [sugestoesAlternativas, setSugestoesAlternativas] = useState<DayAnalysis[]>([]);

  const perfil = EventProfileService.getProfile(perfilKey);

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro: Perfil de evento inválido</h1>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro: Dados insuficientes</h1>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Início
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Vai Chover na Minha Parada?
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Análise de probabilidades climáticas históricas
            </p>
          </div>
        </div>

        {/* Event Info */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Informações do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  Tipo de Evento
                </p>
                <p className="font-semibold text-lg">
                  {perfil.emoji} {perfilKey === 'customizavel' && customEventName ? customEventName : perfil.name}
                </p>
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
          <Card className="border-2">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-lg font-medium">Analisando 20 anos de dados históricos da NASA...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {erro && !loading && (
          <Card className="border-2 border-red-500">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
                <h3 className="text-xl font-bold text-red-600">Erro ao buscar dados</h3>
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
          <Card className={`border-4 ${ProbabilityFormatterService.getBgColor(melhorDia.probability)}`}>
            <CardContent className="p-6 sm:p-8">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold text-muted-foreground">
                  {melhorDia.probability === 0 ? '⚠️ Nenhum Dia Ideal Encontrado' : '🌟 Melhor Dia do Período'}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200">
                  {melhorDia.dateStr}
                </div>
                <div className={`text-5xl sm:text-6xl font-bold ${ProbabilityFormatterService.getTextColor(melhorDia.probability)}`}>
                  {melhorDia.probability.toFixed(1)}%
                </div>
                <div className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Probabilidade de Clima Ideal
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Baseado em {melhorDia.totalYears} anos de dados históricos ({melhorDia.idealYears} anos com clima ideal)
                </p>
                <div className="pt-4">
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {ProbabilityFormatterService.getMessage(melhorDia.probability)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sugestões de Datas Alternativas */}
        {sugestoesAlternativas.length > 0 && !loading && (
          <Card className="border-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-amber-900 dark:text-amber-100">
                💡 Sugestão: Datas Próximas com Melhor Clima
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                Encontramos datas próximas (±30 dias) com probabilidade MAIOR de clima ideal para seu evento!
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
                      className={`p-4 rounded-lg border-2 ${ProbabilityFormatterService.getBgColor(dia.probability)} shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {DateSuggestionsService.getRankEmoji(index)}
                          </div>
                          <div>
                            <div className="font-bold text-lg">{dia.dateStr}</div>
                            <div className="text-xs text-muted-foreground">
                              {textoProximidade} da data selecionada
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${ProbabilityFormatterService.getTextColor(dia.probability)}`}>
                            {dia.probability.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dia.idealYears} de {dia.totalYears} anos
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs bg-green-100 dark:bg-green-900">
                            +{DateSuggestionsService.calculateImprovement(dia.probability, melhorDia?.probability || 0).toFixed(1)}% melhor
                          </Badge>
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Tendência Climática
              </CardTitle>
              <CardDescription>
                Comparação entre dados recentes (últimos 10 anos) vs histórico completo (20 anos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Últimos 10 anos */}
                <div className={`p-6 rounded-lg border-2 ${ProbabilityFormatterService.getBgColor(melhorDia.recentProbability)}`}>
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      📅 Últimos 10 Anos (2015-2024)
                    </div>
                    <div className={`text-4xl font-bold ${ProbabilityFormatterService.getTextColor(melhorDia.recentProbability)}`}>
                      {melhorDia.recentProbability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {melhorDia.idealRecentYears} de {melhorDia.totalRecentYears} anos com clima ideal
                    </div>
                  </div>
                </div>

                {/* 20 anos completos */}
                <div className={`p-6 rounded-lg border-2 ${ProbabilityFormatterService.getBgColor(melhorDia.probability)}`}>
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      📊 Histórico Completo (20 anos)
                    </div>
                    <div className={`text-4xl font-bold ${ProbabilityFormatterService.getTextColor(melhorDia.probability)}`}>
                      {melhorDia.probability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {melhorDia.idealYears} de {melhorDia.totalYears} anos com clima ideal
                    </div>
                  </div>
                </div>
              </div>

              {/* Interpretação da tendência */}
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="text-sm">
                  {(() => {
                    const trend = WeatherAnalysisService.calculateTrend(melhorDia.recentProbability, melhorDia.probability);
                    const trendMsg = ProbabilityFormatterService.getTrendMessage(trend.direction, trend.difference);
                    return (
                      <p className={`${trendMsg.color} font-medium`}>
                        {trendMsg.emoji} <strong>{trendMsg.message.split('.')[0]}.</strong> {trendMsg.message.split('.').slice(1).join('.')}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparação de Dias */}
        {resultado.length > 0 && !loading && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Comparação de Todos os Dias
              </CardTitle>
              <CardDescription>
                Probabilidade de clima ideal para cada dia do período (baseado em 20 anos de dados)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resultado.map((dia) => (
                  <div
                    key={dia.dateStr}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      dia === melhorDia
                        ? `${ProbabilityFormatterService.getBgColor(dia.probability)} shadow-lg`
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-bold text-lg">{dia.dateStr}</div>
                          {dia === melhorDia && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              🌟 Melhor Dia
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${ProbabilityFormatterService.getTextColor(dia.probability)}`}>
                          {dia.probability.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dia.idealYears} de {dia.totalYears} anos (20 anos)
                        </div>
                        <div className={`text-sm font-semibold mt-1 ${ProbabilityFormatterService.getTextColor(dia.recentProbability)}`}>
                          {dia.recentProbability.toFixed(0)}% últimos 10
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Temp. Máx.</span>
                        <div className="font-semibold">
                          {(dia.historicalData.reduce((s, d) => s + d.temp_max, 0) / dia.historicalData.length).toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Temp. Mín.</span>
                        <div className="font-semibold">
                          {(dia.historicalData.reduce((s, d) => s + d.temp_min, 0) / dia.historicalData.length).toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Chuva</span>
                        <div className="font-semibold">
                          {(dia.historicalData.reduce((s, d) => s + d.precipitation, 0) / dia.historicalData.length).toFixed(1)}mm
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Vento</span>
                        <div className="font-semibold">
                          {(dia.historicalData.reduce((s, d) => s + d.wind, 0) / dia.historicalData.length).toFixed(1)}m/s
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Umidade</span>
                        <div className="font-semibold">
                          {(dia.historicalData.reduce((s, d) => s + d.humidity, 0) / dia.historicalData.length).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhes do Melhor Dia */}
        {melhorDia && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Good Years */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Anos com Clima Ideal ({melhorDia.dateStr})
                </CardTitle>
                <CardDescription>Exemplos de anos favoráveis no melhor dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {melhorDia.details.filter((d: any) => d.ideal).slice(0, 5).map((d: any) => (
                    <div key={d.year} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-green-800 dark:text-green-200">{d.year}</span>
                        <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900">Ideal</Badge>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {d.temp_min.toFixed(1)}°C - {d.temp_max.toFixed(1)}°C | Chuva: {d.precipitation.toFixed(1)}mm
                      </p>
                    </div>
                  ))}
                  {melhorDia.idealYears === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      Nenhum ano com clima ideal encontrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bad Years */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Anos com Clima Inadequado ({melhorDia.dateStr})
                </CardTitle>
                <CardDescription>Exemplos de anos desfavoráveis no melhor dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {melhorDia.details.filter((d: any) => !d.ideal).slice(0, 5).map((d: any) => (
                    <div key={d.year} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-red-800 dark:text-red-200">{d.year}</span>
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300">{d.reasons}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
