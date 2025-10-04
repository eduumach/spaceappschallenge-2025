import React, { useState } from "react"
import { Calendar, Download, Loader2, MapPin, AlertCircle, Database, Satellite } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Badge } from "~/components/ui/badge"
import { DateRangePicker, type DateRange } from "~/components/ui/date-range-picker"
import { NASATemporalService, AVAILABLE_PARAMETERS, type NASATemporalResponse } from "~/lib/nasa-api"

interface NASADataQueryModalProps {
  latitude: number
  longitude: number
}

interface FormattedDataEntry {
  date: string
  hour: string
  parameters: Record<string, number>
}

export function NASADataQueryModal({ latitude, longitude }: NASADataQueryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<FormattedDataEntry[] | null>(null)
  const [rawData, setRawData] = useState<NASATemporalResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectedParameters = [
    'PRECTOTCORR', 'WS10M', 'T2MDEW', 'RH2M', 'T2M'
  ]

  const handleQuery = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Selecione um período válido')
      return
    }

    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await NASATemporalService.fetchDataForDateRange(
        latitude,
        longitude,
        dateRange.from,
        dateRange.to,
        selectedParameters
      )

      setRawData(response)
      const formattedData = NASATemporalService.formatDataForDisplay(response)
      setData(formattedData)
      
      // Abrir modal automaticamente quando os dados chegarem
      if (formattedData.length > 0) {
        setIsOpen(true)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar dados da NASA')
    } finally {
      setIsLoading(false)
    }
  }



  const handleExportData = () => {
    if (!data || !rawData) return

    const csvContent = generateCSV(data)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nasa_data_${latitude}_${longitude}_${dateRange?.from?.toISOString().split('T')[0]}_${dateRange?.to?.toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const generateCSV = (data: FormattedDataEntry[]): string => {
    if (data.length === 0) return ''

    const headers = ['Data', 'Hora', ...Object.keys(data[0].parameters)]
    const rows = data.map(entry => [
      entry.date,
      entry.hour,
      ...Object.values(entry.parameters)
    ])

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
  }

  const formatParameterValue = (value: number, parameter: string): string => {
    if (value === -999) return 'N/A'
    
    // Formatação específica por tipo de parâmetro
    switch (parameter) {
      case 'T2M':
        return `${value.toFixed(1)}°C`
      case 'T2MDEW':
        return `${value.toFixed(1)}°C`
      case 'RH2M':
        return `${value.toFixed(1)}%`
      case 'WS10M':
      case 'WS2M':
        return `${value.toFixed(1)} m/s`
      case 'WD10M':
        return `${value.toFixed(0)}°`
      case 'PRECTOTCORR':
        return `${value.toFixed(2)} mm/hr`
      case 'PS':
        return `${(value / 1000).toFixed(1)} kPa`
      case 'CLOUD_AMT':
        return `${value.toFixed(1)}%`
      default:
        return value.toFixed(2)
    }
  }

  return (
    <div className="space-y-4">
      {/* Seleção de período */}
      <div className="space-y-2">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          placeholder="Selecionar período de dados"
        />
        {dateRange?.from && dateRange?.to && (
          <p className="text-xs text-muted-foreground">
            Período: {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} dias
          </p>
        )}
      </div>

      {/* Botão de consulta */}
      <Button
        onClick={handleQuery}
        disabled={isLoading || !dateRange?.from || !dateRange?.to}
        className="w-full"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Consultando...
          </>
        ) : (
          <>
            <Satellite className="mr-2 h-4 w-4" />
            Buscar
          </>
        )}
      </Button>

      {/* Exibição de erro */}
      {error && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Modal de resultados */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[10002]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Resultados 
            </DialogTitle>
            <DialogDescription>
              Dados meteorológicos para Lat: {latitude.toFixed(4)}°, Lng: {longitude.toFixed(4)}°
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Botão de exportar */}
            {data && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            )}

            {/* Exibição dos dados */}
            {data && data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Dados Obtidos ({data.length} registros)
                  </CardTitle>
                  <CardDescription>
                    Dados meteorológicos por hora para o período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {data.slice(0, 24).map((entry, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {new Date(entry.date).toLocaleDateString('pt-BR')} às {entry.hour}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {Object.keys(entry.parameters).length} parâmetros
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {Object.entries(entry.parameters).map(([param, value]) => (
                              <div key={param} className="flex justify-between">
                                <span className="text-muted-foreground">
                                  {AVAILABLE_PARAMETERS[param as keyof typeof AVAILABLE_PARAMETERS] || param}:
                                </span>
                                <span className="font-mono">
                                  {formatParameterValue(value, param)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {data.length > 24 && (
                        <div className="text-center py-4">
                          <Badge variant="outline">
                            Mostrando primeiros 24 registros de {data.length} total
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use "Exportar CSV" para obter todos os dados
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
