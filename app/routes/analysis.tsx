import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Calendar as CalendarComponent } from "~/components/ui/calendar";
import { Header } from "~/components/header";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ArrowLeft, Calendar, ArrowRight, Cloud, Satellite } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "~/lib/utils";
import { EventProfileService } from "~/lib/services/event-profiles.service";
import type { Route } from "./+types/analysis";
import type { DateRange } from "react-day-picker";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Space Apps Challenge 2025 - Análise de Dados" },
    { name: "description", content: "Análise de dados NASA para a localização selecionada" },
  ];
}

const eventProfiles = EventProfileService.getAllProfiles();

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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro: Localização não encontrada</h1>
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className={`p-4 sm:p-6 ${dateRange?.from && dateRange?.to ? 'pb-24' : ''}`}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Análise de Dados Climáticos
              </h1>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground ml-12">
              Configure seu evento e veja as probabilidades climáticas
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5 text-primary" />
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
                      locale={ptBR}
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
                <Satellite className="h-5 w-5 text-primary" />
                Tipo de Evento
              </CardTitle>
              <CardDescription>
                Selecione o tipo de evento para análise personalizada
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
                Ver Probabilidades
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
