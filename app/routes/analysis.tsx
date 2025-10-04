// Página de análise de dados NASA - modificada pelo Claude Sonnet 4.5
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Calendar as CalendarComponent } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ArrowLeft, MapPin, Calendar, ArrowRight, Cloud } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/analysis";
import type { DateRange } from "react-day-picker";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Space Apps Challenge 2025 - Análise de Dados" },
    { name: "description", content: "Análise de dados NASA para a localização selecionada" },
  ];
}

interface PerfilEvento {
  nome: string;
  emoji: string;
  descricao: string;
}

const perfisEventos: Record<string, PerfilEvento> = {
  praia: {
    nome: 'Dia de Praia',
    emoji: '🏖️',
    descricao: 'Dia ensolarado, quente, sem chuva e vento moderado'
  },
  churrasco: {
    nome: 'Churrasco ao Ar Livre',
    emoji: '🍖',
    descricao: 'Sem chuva, temperatura agradável'
  },
  casamento: {
    nome: 'Casamento ao Ar Livre',
    emoji: '💒',
    descricao: 'Clima perfeito, sem chuva, vento leve'
  },
  trilha: {
    nome: 'Trilha/Caminhada',
    emoji: '🥾',
    descricao: 'Temperatura amena, pode ter chuva leve'
  },
  corrida: {
    nome: 'Corrida/Maratona',
    emoji: '🏃',
    descricao: 'Clima fresco, sem chuva'
  },
  cena_chuva: {
    nome: 'Cena de Filme com Chuva',
    emoji: '🎬',
    descricao: 'Precisa de chuva para a cena!'
  },
  observacao_estrelas: {
    nome: 'Observação de Estrelas',
    emoji: '🌟',
    descricao: 'Céu limpo, sem chuva, baixa umidade'
  }
};

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const locationName = searchParams.get('name') || '';
  const searchMode = searchParams.get('mode') || 'map';

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [perfilSelecionado, setPerfilSelecionado] = useState('praia');

  if (!latitude || !longitude) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro: Localização não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Nenhuma coordenada válida foi fornecida. Por favor, retorne à página inicial e selecione uma localização.
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

  const handleContinueToResults = () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert('Por favor, selecione um período de datas para análise');
      return;
    }

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Vai Chover na Minha Parada?
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configure seu evento e veja as probabilidades climáticas
            </p>
          </div>
        </div>

        {/* Location Info */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MapPin className="h-5 w-5 text-blue-600" />
              Localização Selecionada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                <p className="font-mono text-sm sm:text-base">{latitude.toFixed(6)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                <p className="font-mono text-sm sm:text-base">{longitude.toFixed(6)}</p>
              </div>
              {locationName && (
                <div className="space-y-1 sm:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">Local</p>
                  <p className="font-medium text-sm sm:text-base truncate">{locationName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Type Selection */}
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Cloud className="h-5 w-5 text-blue-600" />
              Tipo de Evento
            </CardTitle>
            <CardDescription>
              Selecione o tipo de evento para análise personalizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(perfisEventos).map(([key, perfil]) => (
                <button
                  key={key}
                  onClick={() => setPerfilSelecionado(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    perfilSelecionado === key
                      ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/50 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="text-3xl mb-2">{perfil.emoji}</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {perfil.nome}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {perfil.descricao}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5 text-green-600" />
              Período do Evento
            </CardTitle>
            <CardDescription>
              Selecione um intervalo de datas para análise de dados históricos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-base">Selecione o período</Label>
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
                          {format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                    disabled={(date) => date < new Date("1900-01-01")}
                  />
                </PopoverContent>
              </Popover>
              {dateRange?.from && dateRange?.to && (
                <p className="text-sm text-muted-foreground mt-2">
                  Período selecionado: {format(dateRange.from, "dd/MM/yyyy")} até {format(dateRange.to, "dd/MM/yyyy")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleContinueToResults}
            size="lg"
            className="w-full sm:w-auto"
            disabled={!dateRange?.from || !dateRange?.to}
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Ver Probabilidades
          </Button>
        </div>
      </div>
    </div>
  );
}
