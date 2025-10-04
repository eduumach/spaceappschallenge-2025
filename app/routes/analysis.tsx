import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { NASADataQueryModal } from "~/components/nasa-data-query-modal";
import { ArrowLeft, MapPin, Calendar, Satellite } from "lucide-react";
import type { Route } from "./+types/analysis";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Space Apps Challenge 2025 - Análise de Dados" },
    { name: "description", content: "Análise de dados NASA para a localização selecionada" },
  ];
}

export default function Analysis() {
  const [searchParams] = useSearchParams();
  
  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const locationName = searchParams.get('name') || '';
  const searchMode = searchParams.get('mode') || 'map';

  if (!latitude || !longitude) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-700 to-neutral-500 dark:from-neutral-300 dark:to-neutral-100 bg-clip-text text-transparent">
              Análise de Dados NASA
            </h1>
            <p className="text-muted-foreground">
              Dados coletados para a localização selecionada
            </p>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              Localização Selecionada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Método de Seleção</p>
                <p className="font-medium">
                  {searchMode === 'map' ? 'Mapa Interativo' : 
                   searchMode === 'name' ? 'Busca por Nome' : 
                   'Coordenadas Diretas'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                <p className="font-mono">{latitude.toFixed(6)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                <p className="font-mono">{longitude.toFixed(6)}</p>
              </div>
              {locationName && (
                <div className="space-y-1 md:col-span-3">
                  <p className="text-sm font-medium text-muted-foreground">Nome da Localização</p>
                  <p className="font-medium">{locationName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-neutral-50 to-cyan-50 dark:from-neutral-950/20 dark:to-cyan-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-neutral-600" />
              Consulta de Dados NASA
            </CardTitle>
            <CardDescription>
              Selecione um período para consultar dados científicos da NASA para esta localização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NASADataQueryModal 
              latitude={latitude} 
              longitude={longitude}
            />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Análise Temporal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aqui você poderá visualizar dados históricos e tendências para esta localização.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-purple-600" />
                Dados Satelitais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visualize imagens de satélite e dados de sensoriamento remoto para a região.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
