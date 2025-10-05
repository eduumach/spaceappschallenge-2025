// Página de resultados de análise climática - criada pelo Claude Sonnet 4.5
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Cloud, CheckCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    nome: 'Praia',
    emoji: '🏖️',
    descricao: 'Sol forte, calor intenso, céu limpo',
    criterios: {
      temp_min_ideal: 28,
      temp_max_ideal: 42,
      precipitacao_max: 1,
      vento_max: 10,
      umidade_max: 80
    }
  },
  churrasco: {
    nome: 'Churrasco',
    emoji: '🍖',
    descricao: 'Sem chuva, calor ou clima agradável',
    criterios: {
      temp_min_ideal: 20,
      temp_max_ideal: 38,
      precipitacao_max: 2,
      vento_max: 15
    }
  },
  pelada: {
    nome: 'Pelada/Futebol',
    emoji: '⚽',
    descricao: 'Brasileiro joga bola em qualquer calor!',
    criterios: {
      temp_min_ideal: 20,
      temp_max_ideal: 38,
      precipitacao_max: 3,
      vento_max: 15
    }
  },
  festa_junina: {
    nome: 'Festa Junina',
    emoji: '🌽',
    descricao: 'Clima de inverno brasileiro (fresquinho à noite)',
    criterios: {
      temp_min_ideal: 16,
      temp_max_ideal: 28,
      precipitacao_max: 1,
      vento_max: 12,
      umidade_min: 35,
      umidade_max: 65
    }
  },
  samba_pagode: {
    nome: 'Samba/Pagode ao Ar Livre',
    emoji: '🎵',
    descricao: 'Clima quente e animado para curtir',
    criterios: {
      temp_min_ideal: 24,
      temp_max_ideal: 36,
      precipitacao_max: 2,
      vento_max: 12,
      umidade_max: 80
    }
  },
  carnaval: {
    nome: 'Carnaval de Rua',
    emoji: '🎉',
    descricao: 'Calor ABSURDO de verão brasileiro!',
    criterios: {
      temp_min_ideal: 30,
      temp_max_ideal: 42,
      precipitacao_max: 5,
      vento_max: 15,
      umidade_min: 55,
      umidade_max: 90
    }
  },
  volei_praia: {
    nome: 'Vôlei de Praia',
    emoji: '🏐',
    descricao: 'Areia quente, sol a pino',
    criterios: {
      temp_min_ideal: 28,
      temp_max_ideal: 40,
      precipitacao_max: 1,
      vento_max: 10,
      umidade_max: 75
    }
  },
  pescaria: {
    nome: 'Pescaria',
    emoji: '🎣',
    descricao: 'Manhã tranquila, temperatura moderada',
    criterios: {
      temp_min_ideal: 20,
      temp_max_ideal: 32,
      precipitacao_max: 2,
      vento_max: 12
    }
  },
  piquenique: {
    nome: 'Piquenique no Parque',
    emoji: '🧺',
    descricao: 'Dia agradável sem calor extremo',
    criterios: {
      temp_min_ideal: 22,
      temp_max_ideal: 30,
      precipitacao_max: 0.5,
      vento_max: 10,
      umidade_min: 40,
      umidade_max: 70
    }
  }
};

interface DayAnalysis {
  data: Date;
  dataStr: string;
  probabilidade: number;
  anosIdeais: number;
  totalAnos: number;
  detalhes: any[];
  dadosHistoricos: WeatherData[];
  probabilidadeRecente: number; // últimos 10 anos
  anosIdeaisRecente: number;
  totalAnosRecente: number;
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

  const perfil = perfisEventos[perfilKey];

  useEffect(() => {
    if (latitude && longitude && dataInicio && dataFim) {
      buscarDadosHistoricos();
    }
  }, [latitude, longitude, dataInicio, dataFim]);

  const buscarDadosHistoricos = async () => {
    setLoading(true);
    setErro(false);

    try {
      // Gerar lista de dias no range selecionado pelo usuário
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      const diasSelecionados: Date[] = [];

      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        diasSelecionados.push(new Date(d));
      }

      // Expandir range para ±30 dias para buscar sugestões
      const diasExpandir = 30;
      const inicioExpandido = new Date(inicio);
      inicioExpandido.setDate(inicioExpandido.getDate() - diasExpandir);
      const fimExpandido = new Date(fim);
      fimExpandido.setDate(fimExpandido.getDate() + diasExpandir);

      const diasParaAnalisar: Date[] = [];
      for (let d = new Date(inicioExpandido); d <= fimExpandido; d.setDate(d.getDate() + 1)) {
        diasParaAnalisar.push(new Date(d));
      }

      const anoAtual = new Date().getFullYear();
      const anosPassado = 20;
      const anoInicio = anoAtual - anosPassado;

      // Mapa para agrupar dados históricos por dia/mês (chave: MMDD)
      const dadosPorDia = new Map<string, WeatherData[]>();

      // Inicializar o mapa com arrays vazios para cada dia
      diasParaAnalisar.forEach(dia => {
        const chave = `${(dia.getMonth() + 1).toString().padStart(2, '0')}${dia.getDate().toString().padStart(2, '0')}`;
        dadosPorDia.set(chave, []);
      });

      // Calcular range de datas expandido (formato YYYYMMDD)
      const mesInicioExp = (inicioExpandido.getMonth() + 1).toString().padStart(2, '0');
      const diaInicioExpStr = inicioExpandido.getDate().toString().padStart(2, '0');
      const mesFimExp = (fimExpandido.getMonth() + 1).toString().padStart(2, '0');
      const diaFimExpStr = fimExpandido.getDate().toString().padStart(2, '0');

      // Para cada ano histórico, buscar dados do range completo expandido
      const todasPromessas = [];

      for (let ano = anoInicio; ano < anoAtual; ano++) {
        const startDate = `${ano}${mesInicioExp}${diaInicioExpStr}`;
        const endDate = `${ano}${mesFimExp}${diaFimExpStr}`;

        const params = new URLSearchParams({
          start: startDate,
          end: endDate,
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

                // Processar cada dia retornado no range
                const datas = Object.keys(p.T2M_MAX || {});
                datas.forEach(dateStr => {
                  // Extrair mês/dia da data (formato YYYYMMDD -> MMDD)
                  const mmdd = dateStr.substring(4, 8);

                  if (dadosPorDia.has(mmdd)) {
                    dadosPorDia.get(mmdd)?.push({
                      ano,
                      temp_max: p.T2M_MAX?.[dateStr] ?? NaN,
                      temp_min: p.T2M_MIN?.[dateStr] ?? NaN,
                      precipitacao: p.PRECTOTCORR?.[dateStr] ?? NaN,
                      vento: p.WS10M?.[dateStr] ?? NaN,
                      umidade: p.RH2M?.[dateStr] ?? NaN
                    });
                  }
                });
              }
              return ano;
            })
            .catch(() => null)
        );
      }

      await Promise.all(todasPromessas);

      // Analisar cada dia com seus dados históricos agrupados
      const analisesPorDia: DayAnalysis[] = [];
      const todasAnalises: DayAnalysis[] = [];

      diasParaAnalisar.forEach(diaAtual => {
        const chave = `${(diaAtual.getMonth() + 1).toString().padStart(2, '0')}${diaAtual.getDate().toString().padStart(2, '0')}`;
        const dadosHistoricos = dadosPorDia.get(chave) || [];

        if (dadosHistoricos.length > 0) {
          const analise = analisarDados(dadosHistoricos, diaAtual);
          todasAnalises.push(analise);

          // Verificar se está no range selecionado
          const isDentroRange = diasSelecionados.some(d =>
            d.getMonth() === diaAtual.getMonth() && d.getDate() === diaAtual.getDate()
          );

          if (isDentroRange) {
            analisesPorDia.push(analise);
          }
        }
      });

      if (analisesPorDia.length === 0) {
        setErro(true);
        setLoading(false);
        return;
      }

      setResultado(analisesPorDia);

      // Determinar o melhor dia do período selecionado
      const melhor = analisesPorDia.reduce((prev, current) =>
        current.probabilidade > prev.probabilidade ? current : prev
      );
      setMelhorDia(melhor);

      // Encontrar sugestões de dias melhores próximos (fora do range selecionado)
      const diasAlternativos = todasAnalises
        .filter(dia => {
          // Excluir dias do range selecionado
          const isDentroRange = diasSelecionados.some(d =>
            d.getMonth() === dia.data.getMonth() && d.getDate() === dia.data.getDate()
          );
          return !isDentroRange;
        })
        .filter(dia => dia.probabilidade > melhor.probabilidade) // Só mostrar se for melhor
        .sort((a, b) => {
          // Ordenar por probabilidade (maior primeiro)
          if (b.probabilidade !== a.probabilidade) {
            return b.probabilidade - a.probabilidade;
          }
          // Se probabilidades iguais, ordenar por proximidade temporal
          const distA = Math.abs(a.data.getTime() - inicio.getTime());
          const distB = Math.abs(b.data.getTime() - inicio.getTime());
          return distA - distB;
        })
        .slice(0, 5); // Top 5 sugestões

      setSugestoesAlternativas(diasAlternativos);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const analisarDados = (dados: WeatherData[], data: Date): DayAnalysis => {
    const criterios = perfil.criterios;

    let anosIdeais = 0;
    let anosIdeaisRecente = 0;
    const detalhes: any[] = [];

    const anoAtual = new Date().getFullYear();
    const anoLimiteRecente = anoAtual - 10; // últimos 10 anos

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

      if (ideal) {
        anosIdeais++;
        if (d.ano >= anoLimiteRecente) {
          anosIdeaisRecente++;
        }
      }

      detalhes.push({
        ...d,
        ideal,
        motivos: motivos.join(', ') || 'OK'
      });
    });

    const dadosRecentes = dados.filter(d => d.ano >= anoLimiteRecente);
    const probabilidade = (anosIdeais / dados.length) * 100;
    const probabilidadeRecente = dadosRecentes.length > 0
      ? (anosIdeaisRecente / dadosRecentes.length) * 100
      : 0;

    return {
      data,
      dataStr: format(data, "dd 'de' MMMM", { locale: ptBR }),
      probabilidade,
      anosIdeais,
      totalAnos: dados.length,
      detalhes,
      dadosHistoricos: dados,
      probabilidadeRecente,
      anosIdeaisRecente,
      totalAnosRecente: dadosRecentes.length
    };
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
                <p className="font-semibold text-lg">{perfil.emoji} {perfil.nome}</p>
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
          <Card className={`border-4 ${getBgProbabilidade(melhorDia.probabilidade)}`}>
            <CardContent className="p-6 sm:p-8">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold text-muted-foreground">
                  {melhorDia.probabilidade === 0 ? '⚠️ Nenhum Dia Ideal Encontrado' : '🌟 Melhor Dia do Período'}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200">
                  {melhorDia.dataStr}
                </div>
                <div className={`text-5xl sm:text-6xl font-bold ${getCorProbabilidade(melhorDia.probabilidade)}`}>
                  {melhorDia.probabilidade.toFixed(1)}%
                </div>
                <div className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Probabilidade de Clima Ideal
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Baseado em {melhorDia.totalAnos} anos de dados históricos ({melhorDia.anosIdeais} anos com clima ideal)
                </p>
                <div className="pt-4">
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {getMensagemProbabilidade(melhorDia.probabilidade)}
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
                  const diferencaDias = Math.round((dia.data.getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24));
                  const textoProximidade = diferencaDias > 0
                    ? `${diferencaDias} dias depois`
                    : `${Math.abs(diferencaDias)} dias antes`;

                  return (
                    <div
                      key={dia.dataStr}
                      className={`p-4 rounded-lg border-2 ${getBgProbabilidade(dia.probabilidade)} shadow-md`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                          </div>
                          <div>
                            <div className="font-bold text-lg">{dia.dataStr}</div>
                            <div className="text-xs text-muted-foreground">
                              {textoProximidade} da data selecionada
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getCorProbabilidade(dia.probabilidade)}`}>
                            {dia.probabilidade.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dia.anosIdeais} de {dia.totalAnos} anos
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs bg-green-100 dark:bg-green-900">
                            +{(dia.probabilidade - (melhorDia?.probabilidade || 0)).toFixed(1)}% melhor
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
                <div className={`p-6 rounded-lg border-2 ${getBgProbabilidade(melhorDia.probabilidadeRecente)}`}>
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      📅 Últimos 10 Anos (2015-2024)
                    </div>
                    <div className={`text-4xl font-bold ${getCorProbabilidade(melhorDia.probabilidadeRecente)}`}>
                      {melhorDia.probabilidadeRecente.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {melhorDia.anosIdeaisRecente} de {melhorDia.totalAnosRecente} anos com clima ideal
                    </div>
                  </div>
                </div>

                {/* 20 anos completos */}
                <div className={`p-6 rounded-lg border-2 ${getBgProbabilidade(melhorDia.probabilidade)}`}>
                  <div className="text-center space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      📊 Histórico Completo (20 anos)
                    </div>
                    <div className={`text-4xl font-bold ${getCorProbabilidade(melhorDia.probabilidade)}`}>
                      {melhorDia.probabilidade.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {melhorDia.anosIdeais} de {melhorDia.totalAnos} anos com clima ideal
                    </div>
                  </div>
                </div>
              </div>

              {/* Interpretação da tendência */}
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="text-sm">
                  {melhorDia.probabilidadeRecente > melhorDia.probabilidade + 10 ? (
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      📈 <strong>Tendência positiva!</strong> O clima está {(melhorDia.probabilidadeRecente - melhorDia.probabilidade).toFixed(1)}% mais favorável nos últimos anos.
                    </p>
                  ) : melhorDia.probabilidadeRecente < melhorDia.probabilidade - 10 ? (
                    <p className="text-orange-700 dark:text-orange-300 font-medium">
                      📉 <strong>Tendência negativa.</strong> O clima está {(melhorDia.probabilidade - melhorDia.probabilidadeRecente).toFixed(1)}% menos favorável nos últimos anos.
                    </p>
                  ) : (
                    <p className="text-blue-700 dark:text-blue-300 font-medium">
                      ➡️ <strong>Clima estável.</strong> Não há mudança significativa entre os períodos recentes e históricos.
                    </p>
                  )}
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
                    key={dia.dataStr}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      dia === melhorDia
                        ? `${getBgProbabilidade(dia.probabilidade)} shadow-lg`
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-bold text-lg">{dia.dataStr}</div>
                          {dia === melhorDia && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              🌟 Melhor Dia
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getCorProbabilidade(dia.probabilidade)}`}>
                          {dia.probabilidade.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dia.anosIdeais} de {dia.totalAnos} anos (20 anos)
                        </div>
                        <div className={`text-sm font-semibold mt-1 ${getCorProbabilidade(dia.probabilidadeRecente)}`}>
                          {dia.probabilidadeRecente.toFixed(0)}% últimos 10
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Temp. Máx.</span>
                        <div className="font-semibold">
                          {(dia.dadosHistoricos.reduce((s, d) => s + d.temp_max, 0) / dia.dadosHistoricos.length).toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Temp. Mín.</span>
                        <div className="font-semibold">
                          {(dia.dadosHistoricos.reduce((s, d) => s + d.temp_min, 0) / dia.dadosHistoricos.length).toFixed(1)}°C
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Chuva</span>
                        <div className="font-semibold">
                          {(dia.dadosHistoricos.reduce((s, d) => s + d.precipitacao, 0) / dia.dadosHistoricos.length).toFixed(1)}mm
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Vento</span>
                        <div className="font-semibold">
                          {(dia.dadosHistoricos.reduce((s, d) => s + d.vento, 0) / dia.dadosHistoricos.length).toFixed(1)}m/s
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Umidade</span>
                        <div className="font-semibold">
                          {(dia.dadosHistoricos.reduce((s, d) => s + d.umidade, 0) / dia.dadosHistoricos.length).toFixed(1)}%
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
                  Anos com Clima Ideal ({melhorDia.dataStr})
                </CardTitle>
                <CardDescription>Exemplos de anos favoráveis no melhor dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {melhorDia.detalhes.filter((d: any) => d.ideal).slice(0, 5).map((d: any) => (
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
                  {melhorDia.anosIdeais === 0 && (
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
                  Anos com Clima Inadequado ({melhorDia.dataStr})
                </CardTitle>
                <CardDescription>Exemplos de anos desfavoráveis no melhor dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {melhorDia.detalhes.filter((d: any) => !d.ideal).slice(0, 5).map((d: any) => (
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
        )}
      </div>
    </div>
  );
}
