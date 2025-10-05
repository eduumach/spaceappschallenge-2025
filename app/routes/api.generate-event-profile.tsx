import type { ActionFunctionArgs } from "react-router";

/**
 * API Route para gerar critérios de perfil de evento usando OpenAI
 * Esta rota mantém a API key segura no backend
 */

interface GenerateProfileRequest {
  eventDescription: string;
}

interface GenerateProfileResponse {
  success: boolean;
  data?: {
    name: string;
    description: string;
    criteria: {
      temp_min_ideal: number;
      temp_max_ideal: number;
      precipitation_max: number;
      wind_max: number;
      humidity_min?: number;
      humidity_max?: number;
    };
  };
  error?: string;
}

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  try {
    const body: GenerateProfileRequest = await request.json();
    
    const { eventDescription } = body;

    if (!eventDescription || eventDescription.trim().length === 0) {
      return Response.json({
        success: false,
        error: 'Event description is required'
      } as GenerateProfileResponse, { status: 400 });
    }

    // Buscar a API key da variável de ambiente
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return Response.json({
        success: false,
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      } as GenerateProfileResponse, { status: 500 });
    }

    // Criar o prompt para a OpenAI
    const systemMessage = `Você é um especialista em análise climática e planejamento de eventos. 
Sua tarefa é analisar a descrição de um evento e determinar as condições climáticas ideais para sua realização.

Retorne APENAS um objeto JSON válido (sem markdown, sem explicações) com a seguinte estrutura:
{
  "name": "Nome curto do evento (máximo 30 caracteres)",
  "description": "Breve descrição do evento (máximo 80 caracteres)",
  "criteria": {
    "temp_min_ideal": número (temperatura mínima ideal em °C),
    "temp_max_ideal": número (temperatura máxima ideal em °C),
    "precipitation_max": número (precipitação máxima aceitável em mm),
    "wind_max": número (velocidade do vento máxima em km/h),
    "humidity_min": número opcional (umidade mínima ideal em %),
    "humidity_max": número opcional (umidade máxima ideal em %)
  }
}

Considere:
- Atividades ao ar livre geralmente requerem menos precipitação
- Atividades físicas intensas preferem temperaturas mais amenas
- Eventos noturnos podem tolerar temperaturas mais baixas
- Umidade alta pode ser desconfortável para atividades físicas`;

    const userPrompt = `Analise este evento e retorne os critérios climáticos ideais em JSON:

Evento: ${eventDescription.trim()}`;

    // Fazer a chamada para OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Baixa temperatura para respostas mais consistentes
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API Error:', error);
      return Response.json({
        success: false,
        error: 'Failed to generate event profile. Please try again.'
      } as GenerateProfileResponse, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse o JSON retornado
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content);
      return Response.json({
        success: false,
        error: 'Invalid response format from AI'
      } as GenerateProfileResponse, { status: 500 });
    }

    // Validar a estrutura dos dados
    if (!parsedData.name || !parsedData.description || !parsedData.criteria) {
      return Response.json({
        success: false,
        error: 'Invalid data structure from AI'
      } as GenerateProfileResponse, { status: 500 });
    }

    // Garantir que os valores numéricos estão dentro de limites razoáveis
    const criteria = {
      temp_min_ideal: Math.max(-10, Math.min(50, Number(parsedData.criteria.temp_min_ideal) || 20)),
      temp_max_ideal: Math.max(-10, Math.min(50, Number(parsedData.criteria.temp_max_ideal) || 30)),
      precipitation_max: Math.max(0, Math.min(100, Number(parsedData.criteria.precipitation_max) || 2)),
      wind_max: Math.max(0, Math.min(100, Number(parsedData.criteria.wind_max) || 10)),
      ...(parsedData.criteria.humidity_min && { 
        humidity_min: Math.max(0, Math.min(100, Number(parsedData.criteria.humidity_min)))
      }),
      ...(parsedData.criteria.humidity_max && { 
        humidity_max: Math.max(0, Math.min(100, Number(parsedData.criteria.humidity_max)))
      })
    };

    return Response.json({
      success: true,
      data: {
        name: String(parsedData.name).substring(0, 30),
        description: String(parsedData.description).substring(0, 80),
        criteria
      }
    } as GenerateProfileResponse);

  } catch (error) {
    console.error('Generate Profile API Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as GenerateProfileResponse, { status: 500 });
  }
}
