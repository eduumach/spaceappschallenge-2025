// Tipos para a API da NASA POWER
export interface NASATemporalRequest {
  latitude: number
  longitude: number
  startDate: string // formato YYYYMMDD
  endDate: string   // formato YYYYMMDD
  parameters?: string[] // parâmetros específicos a consultar
  community?: 'AG' | 'SB' | 'SSE' // Agricultural, Sustainable Buildings, Solar & Wind
  format?: 'JSON' | 'CSV' | 'NETCDF' | 'GEOTIFF'
  header?: boolean
  time_standard?: 'LST' | 'UTC'
}

export interface NASATemporalResponse {
  type: string
  geometry: {
    type: string
    coordinates: [number, number]
  }
  properties: {
    parameter: Record<string, any>
  }
  header?: {
    title: string
    api_version: string
    format: string
    time_standard: string
    start: string
    end: string
  }
}

export interface NASAErrorResponse {
  messages: {
    code: string  
    text: string
  }[]
}

// Parâmetros disponíveis na API da NASA POWER
export const AVAILABLE_PARAMETERS = {
  // Precipitação
  PRECTOTCORR: 'Precipitação Total Corrigida (mm/hr)',
  
  // Vento
  WS10M: 'Velocidade do Vento a 10m (m/s)',
  
  // Temperatura e umidade
  T2MDEW: 'Ponto de Orvalho (°C)',
  RH2M: 'Umidade Relativa (%)',
  T2M: 'Temperatura (°C)',
  
  // Parâmetros adicionais úteis
  WD10M: 'Direção do Vento a 10m (graus)',
  WS2M: 'Velocidade do Vento a 2m (m/s)',
  PS: 'Pressão Superficial (Pa)',
  CLOUD_AMT: 'Quantidade de Nuvens (%)'
} as const

// Função para formatar data para o formato da NASA API (YYYYMMDD)
function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// Função para validar datas
function validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
  const today = new Date()
  const maxPastDate = new Date()
  maxPastDate.setFullYear(today.getFullYear() - 40) // API suporta dados desde ~1981

  if (startDate > today) {
    return { isValid: false, error: 'Data de início não pode ser no futuro' }
  }

  if (endDate > today) {
    return { isValid: false, error: 'Data de fim não pode ser no futuro' }
  }

  if (startDate < maxPastDate) {
    return { isValid: false, error: 'Data de início muito antiga (máximo ~40 anos)' }
  }

  if (startDate > endDate) {
    return { isValid: false, error: 'Data de início deve ser anterior à data de fim' }
  }

  // Limite de 1 ano de dados por consulta
  const oneYearLater = new Date(startDate)
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  
  if (endDate > oneYearLater) {
    return { isValid: false, error: 'Período máximo permitido é de 1 ano' }
  }

  return { isValid: true }
}

// Classe principal do serviço NASA API
export class NASATemporalService {
  private static readonly BASE_URL = 'https://power.larc.nasa.gov/api/temporal/hourly/point'
  
  // Método para obter parâmetros disponíveis
  static getAvailableParameters(): typeof AVAILABLE_PARAMETERS {
    return AVAILABLE_PARAMETERS
  }

  // Método para formatar dados para exibição
  static formatDataForDisplay(data: NASATemporalResponse): Array<{
    date: string
    hour: string
    parameters: Record<string, number>
  }> {
    const formattedData: Array<{
      date: string
      hour: string
      parameters: Record<string, number>
    }> = []

    // A NASA API retorna dados por hora em formato específico
    // Aqui assumimos que o campo 'parameter' contém os dados organizados por timestamp
    const parameters = data.properties.parameter

    // Iterar sobre cada parâmetro
    Object.keys(parameters).forEach(paramKey => {
      const paramData = parameters[paramKey]
      
      // Cada parâmetro tem dados organizados por timestamp (YYYYMMDDHH)
      if (typeof paramData === 'object') {
        Object.keys(paramData).forEach(timestamp => {
          const value = paramData[timestamp]
          
          // Extrair data e hora do timestamp
          const year = timestamp.substring(0, 4)
          const month = timestamp.substring(4, 6)
          const day = timestamp.substring(6, 8)
          const hour = timestamp.substring(8, 10)
          
          const dateStr = `${year}-${month}-${day}`
          const hourStr = `${hour}:00`
          
          // Encontrar ou criar entrada para esta data/hora
          let entry = formattedData.find(item => 
            item.date === dateStr && item.hour === hourStr
          )
          
          if (!entry) {
            entry = {
              date: dateStr,
              hour: hourStr,
              parameters: {}
            }
            formattedData.push(entry)
          }
          
          entry.parameters[paramKey] = value
        })
      }
    })

    // Ordenar por data e hora
    return formattedData.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.hour}`)
      const dateTimeB = new Date(`${b.date} ${b.hour}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })
  }
}
