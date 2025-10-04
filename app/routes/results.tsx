// Página de resultados de análise climática - criada pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Cloud, Thermometer, Wind, Droplets, CheckCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react";
import type { Route } from "./+types/results";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resultados - Vai Chover na Minha Parada?" },
    { name: "description", content: "Análise de probabilidades climáticas baseada em dados históricos da NASA" },
  ];
}

interface WeatherData {
  ano: number;
  temp_max: number;
  temp_min: number;
  precipitacao: number;
  vento: number;
  umidade: number;
}

interface Criterios {
  temp_min_ideal?: number;
  temp_max_ideal?: number;
  precipitacao_min?: number;
  precipitacao_max?: number;
  vento_max?: number;
  umidade_min?: number;
  umidade_max?: number;
}

interface PerfilEvento {
  nome: string;
  emoji: string;
  descricao: string;
  criterios: Criterios;
}

const perfisEventos: Record<string, PerfilEvento> = {
  praia: {
    nome: 'Dia de Praia',
    emoji: '🏖️',
    descricao: 'Dia ensolarado, quente, sem chuva e vento moderado',
    criterios: {
      temp_min_ideal: 25,
      temp_max_ideal: 35,
      precipitacao_max: 2,
      vento_max: 8,
      umidade_max: 75
    }
  },
  churrasco: {
    nome: 'Churrasco ao Ar Livre',
    emoji: '🍖',
    descricao: 'Sem chuva, temperatura agradável',
    criterios: {
      temp_min_ideal: 18,
      temp_max_ideal: 32,
      precipitacao_max: 1,
      vento_max: 12
    }
  },
  casamento: {
    nome: 'Casamento ao Ar Livre',
    emoji: '💒',
    descricao: 'Clima perfeito, sem chuva, vento leve',
    criterios: {
      temp_min_ideal: 20,
      temp_max_ideal: 28,
      precipitacao_max: 0.5,
      vento_max: 6,
      umidade_min: 40,
      umidade_max: 70
    }
  },
  trilha: {
    nome: 'Trilha/Caminhada',
    emoji: '🥾',
    descricao: 'Temperatura amena, pode ter chuva leve',
    criterios: {
      temp_min_ideal: 15,
      temp_max_ideal: 28,
      precipitacao_max: 3,
      vento_max: 15
    }
  },
  corrida: {
    nome: 'Corrida/Maratona',
    emoji: '🏃',
    descricao: 'Clima fresco, sem chuva',
    criterios: {
      temp_min_ideal: 12,
      temp_max_ideal: 22,
      precipitacao_max: 1,
      vento_max: 10
    }
  },
  cena_chuva: {
    nome: 'Cena de Filme com Chuva',
    emoji: '🎬',
    descricao: 'Precisa de chuva para a cena!',
    criterios: {
      temp_min_ideal: 15,
      temp_max_ideal: 30,
      precipitacao_min: 5,
      precipitacao_max: 50,
      vento_max: 15
    }
  },
  observacao_estrelas: {
    nome: 'Observação de Estrelas',
    emoji: '🌟',
    descricao: 'Céu limpo, sem chuva, baixa umidade',
    criterios: {
      temp_min_ideal: 10,
      temp_max_ideal: 25,
      precipitacao_max: 0,
      vento_max: 12,
      umidade_max: 65
    }
  }
};

export default function Results() {
  const [searchParams] = useSearchParams();

  const latitude = parseFloat(searchParams.get('lat') || '0');
  const longitude = parseFloat(searchParams.get('lng') || '0');
  const dia = searchParams.get('dia') || '';
  const mes = searchParams.get('mes') || '';
  const perfilKey = searchParams.get('perfil') || 'praia';
  const locationName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState<any>(null);
  const [dadosHistoricos, setDadosHistoricos] = useState<WeatherData[]>([]);
  const [erro, setErro] = useState(false);

  const perfil = perfisEventos[perfilKey];

  useEffect(() => {
    if (latitude && longitude && dia && mes) {
      buscarDadosHistoricos();
    }
  }, [latitude, longitude, dia, mes]);

  const buscarDadosHistoricos = async () => {
    setLoading(true);
    setErro(false);

    try {
      const anoAtual = new Date().getFullYear();
      const anosPassado = 30;
      const anoInicio = anoAtual - anosPassado;

      const todasPromessas = [];

      for (let ano = anoInicio; ano < anoAtual; ano++) {
        const dateStr = `${ano}${mes.padStart(2, '0')}${dia.padStart(2, '0')}`;

        const params = new URLSearchParams({
          start: dateStr,
          end: dateStr,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          community: 'ag',
          parameters: 'T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M,RH2M',
          format: 'json'
        });

        todasPromessas.push(
          fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?${params}`)
            .then(res => res.json())
            .then(data => {
              if (data?.properties?.parameter) {
                const p = data.properties.parameter;
                return {
                  ano,
                  temp_max: p.T2M_MAX?.[dateStr] ?? NaN,
                  temp_min: p.T2M_MIN?.[dateStr] ?? NaN,
                  precipitacao: p.PRECTOTCORR?.[dateStr] ?? NaN,
                  vento: p.WS10M?.[dateStr] ?? NaN,
                  umidade: p.RH2M?.[dateStr] ?? NaN
                };
              }
              return null;
            })
            .catch(() => null)
        );
      }

      const resultados = await Promise.all(todasPromessas);
      const dadosValidos = resultados.filter(d => d !== null) as WeatherData[];

      if (dadosValidos.length === 0) {
        setErro(true);
        setLoading(false);
        return;
      }

      setDadosHistoricos(dadosValidos);
      analisarDados(dadosValidos);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const analisarDados = (dados: WeatherData[]) => {
    const criterios = perfil.criterios;

    let anosIdeais = 0;
    const detalhes: any[] = [];

    dados.forEach(d => {
      let ideal = true;
      const motivos: string[] = [];

      if (criterios.temp_min_ideal !== undefined && d.temp_min < criterios.temp_min_ideal) {
        ideal = false;
        motivos.push(`muito frio (${d.temp_min.toFixed(1)}°C)`);
      }

      if (criterios.temp_max_ideal !== undefined && d.temp_max > criterios.temp_max_ideal) {
        ideal = false;
        motivos.push(`muito quente (${d.temp_max.toFixed(1)}°C)`);
      }

      if (criterios.precipitacao_min !== undefined && d.precipitacao < criterios.precipitacao_min) {
        ideal = false;
        motivos.push(`chuva insuficiente (${d.precipitacao.toFixed(1)}mm)`);
      }

      if (criterios.precipitacao_max !== undefined && d.precipitacao > criterios.precipitacao_max) {
        ideal = false;
        motivos.push(`muita chuva (${d.precipitacao.toFixed(1)}mm)`);
      }

      if (criterios.vento_max !== undefined && d.vento > criterios.vento_max) {
        ideal = false;
        motivos.push(`muito vento (${d.vento.toFixed(1)}m/s)`);
      }

      if (criterios.umidade_min !== undefined && d.umidade < criterios.umidade_min) {
        ideal = false;
        motivos.push(`muito seco (${d.umidade.toFixed(1)}%)`);
      }

      if (criterios.umidade_max !== undefined && d.umidade > criterios.umidade_max) {
        ideal = false;
        motivos.push(`muito úmido (${d.umidade.toFixed(1)}%)`);
      }

      if (ideal) anosIdeais++;

      detalhes.push({
        ...d,
        ideal,
        motivos: motivos.join(', ') || 'OK'
      });
    });

    const probabilidade = (anosIdeais / dados.length) * 100;

    setResultado({
      probabilidade,
      anosIdeais,
      totalAnos: dados.length,
      detalhes
    });
  };

  const getCorProbabilidade = (prob: number) => {
    if (prob >= 80) return 'text-green-600';
    if (prob >= 60) return 'text-blue-600';
    if (prob >= 40) return 'text-yellow-600';
    if (prob >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgProbabilidade = (prob: number) => {
    if (prob >= 80) return 'bg-green-50 dark:bg-green-950/20 border-green-500';
    if (prob >= 60) return 'bg-blue-50 dark:bg-blue-950/20 border-blue-500';
    if (prob >= 40) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500';
    if (prob >= 20) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-500';
    return 'bg-red-50 dark:bg-red-950/20 border-red-500';
  };

  const getMensagemProbabilidade = (prob: number) => {
    if (prob >= 80) return '🌟 EXCELENTE! Altíssima probabilidade de clima perfeito!';
    if (prob >= 60) return '👍 BOA probabilidade de clima favorável!';
    if (prob >= 40) return '⚡ Probabilidade MODERADA - tenha um plano B!';
    if (prob >= 20) return '⚠️ Probabilidade BAIXA - considere outra data!';
    return '🚨 ALERTA! Muito improvável ter clima adequado!';
  };

  const mesesNomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  if (!latitude || !longitude || !dia || !mes) {
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
                <p className="font-semibold text-lg">{perfil.emoji} {perfil.nome}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data
                </p>
                <p className="font-semibold">{dia} de {mesesNomes[parseInt(mes)]}</p>
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
                <p className="text-lg font-medium">Analisando 30 anos de dados históricos da NASA...</p>
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

        {/* Results */}
        {resultado && !loading && (
          <>
            {/* Main Result Card */}
            <Card className={`border-4 ${getBgProbabilidade(resultado.probabilidade)}`}>
              <CardContent className="p-6 sm:p-8">
                <div className="text-center space-y-4">
                  <div className={`text-6xl sm:text-7xl font-bold ${getCorProbabilidade(resultado.probabilidade)}`}>
                    {resultado.probabilidade.toFixed(1)}%
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    Probabilidade de Clima Ideal
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Baseado em {resultado.totalAnos} anos de dados históricos ({resultado.anosIdeais} anos com clima ideal)
                  </p>
                  <div className="pt-4">
                    <Badge variant="outline" className="text-base px-4 py-2">
                      {getMensagemProbabilidade(resultado.probabilidade)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                {
                  label: 'Temp. Máx.',
                  value: (dadosHistoricos.reduce((s, d) => s + d.temp_max, 0) / dadosHistoricos.length).toFixed(1) + '°C',
                  icon: Thermometer,
                  color: 'text-red-500',
                  bg: 'bg-red-50 dark:bg-red-950/20'
                },
                {
                  label: 'Temp. Mín.',
                  value: (dadosHistoricos.reduce((s, d) => s + d.temp_min, 0) / dadosHistoricos.length).toFixed(1) + '°C',
                  icon: Thermometer,
                  color: 'text-blue-500',
                  bg: 'bg-blue-50 dark:bg-blue-950/20'
                },
                {
                  label: 'Chuva',
                  value: (dadosHistoricos.reduce((s, d) => s + d.precipitacao, 0) / dadosHistoricos.length).toFixed(1) + 'mm',
                  icon: Cloud,
                  color: 'text-gray-500',
                  bg: 'bg-gray-50 dark:bg-gray-950/20'
                },
                {
                  label: 'Vento',
                  value: (dadosHistoricos.reduce((s, d) => s + d.vento, 0) / dadosHistoricos.length).toFixed(1) + 'm/s',
                  icon: Wind,
                  color: 'text-cyan-500',
                  bg: 'bg-cyan-50 dark:bg-cyan-950/20'
                },
                {
                  label: 'Umidade',
                  value: (dadosHistoricos.reduce((s, d) => s + d.umidade, 0) / dadosHistoricos.length).toFixed(1) + '%',
                  icon: Droplets,
                  color: 'text-indigo-500',
                  bg: 'bg-indigo-50 dark:bg-indigo-950/20'
                }
              ].map((stat, i) => (
                <Card key={i} className={`border-2 ${stat.bg}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Historical Examples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Good Years */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Anos com Clima Ideal
                  </CardTitle>
                  <CardDescription>Exemplos de anos favoráveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resultado.detalhes.filter((d: any) => d.ideal).slice(0, 5).map((d: any) => (
                      <div key={d.ano} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-green-800 dark:text-green-200">{d.ano}</span>
                          <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900">Ideal</Badge>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {d.temp_min.toFixed(1)}°C - {d.temp_max.toFixed(1)}°C | Chuva: {d.precipitacao.toFixed(1)}mm
                        </p>
                      </div>
                    ))}
                    {resultado.anosIdeais === 0 && (
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
                    Anos com Clima Inadequado
                  </CardTitle>
                  <CardDescription>Exemplos de anos desfavoráveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resultado.detalhes.filter((d: any) => !d.ideal).slice(0, 5).map((d: any) => (
                      <div key={d.ano} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-red-800 dark:text-red-200">{d.ano}</span>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300">{d.motivos}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
