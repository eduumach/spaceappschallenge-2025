# Documentation - NASA Space Apps Challenge 2025

Este diretório contém toda a documentação técnica do projeto, incluindo metodologia, visualizações e ferramentas para gerar gráficos.

## 📁 Arquivos

### Documentação Principal

- **`METHODOLOGY.md`** - Documentação completa da metodologia do projeto
  - Como obtemos dados da NASA POWER API
  - Pipeline de processamento de dados
  - Cálculo de probabilidades
  - Análise de tendências
  - Casos de uso e exemplos

- **`DATA_PROCESSING_VISUALIZATION.md`** - Guia visual detalhado
  - Visualizações do processamento de dados
  - Gráficos explicativos passo a passo
  - Exemplos práticos com dados reais
  - Diagramas de fluxo

### Geração de Gráficos

- **`generate_visualizations.py`** - Script Python para gerar todos os gráficos
- **`requirements.txt`** - Dependências Python necessárias

## 🚀 Como Gerar os Gráficos

### 1. Instalar Dependências

```bash
cd docs
pip install -r requirements.txt
```

### 2. Executar o Script

```bash
python generate_visualizations.py
```

### 3. Resultados

O script irá criar um diretório `visualizations/` com 10 gráficos:

```
visualizations/
├── 01_temperature_timeseries.png      # Série temporal de temperatura
├── 02_precipitation_pattern.png       # Padrão de precipitação
├── 03_multi_parameter_dashboard.png   # Dashboard com todos os parâmetros
├── 04_criteria_evaluation.png         # Avaliação ano a ano
├── 05_probability_gauge.png           # Medidor de probabilidade
├── 06_date_range_heatmap.png          # Heatmap de datas
├── 07_trend_analysis.png              # Análise de tendências
├── 08_processing_pipeline.png         # Pipeline de processamento
├── 09_probability_distribution.png    # Distribuição de probabilidades
└── 10_summary_infographic.png         # Infográfico resumo
```

## 📊 Descrição dos Gráficos

### 1. Temperature Timeseries
Mostra como a temperatura máxima e mínima variou ao longo de 20 anos para uma data específica (ex: 25 de dezembro).

### 2. Precipitation Pattern
Visualiza o padrão de chuva histórico, destacando anos com chuva aceitável (verde) vs. muita chuva (vermelho).

### 3. Multi-Parameter Dashboard
Dashboard completo com 4 painéis mostrando temperatura, precipitação, vento e umidade simultaneamente.

### 4. Criteria Evaluation
Barra colorida mostrando quais anos passaram (verde) ou falharam (vermelho) nos critérios do evento.

### 5. Probability Gauge
Medidor estilo velocímetro mostrando a probabilidade de 0-100% com classificação (Excellent, Good, etc).

### 6. Date Range Heatmap
Heatmap horizontal mostrando probabilidades para múltiplas datas, destacando a melhor data alternativa.

### 7. Trend Analysis
Compara probabilidade histórica (2005-2014) vs. recente (2015-2024) para detectar tendências climáticas.

### 8. Processing Pipeline
Fluxograma visual do pipeline de processamento de dados do projeto.

### 9. Probability Distribution
Histograma mostrando a distribuição de probabilidades com curva gaussiana sobreposta.

### 10. Summary Infographic
Infográfico completo com métricas-chave: probabilidade, temperatura média, distribuição de chuva, etc.

## 🎨 Personalização

Para adaptar os gráficos ao seu projeto:

1. **Editar dados**: Modifique a função `generate_sample_data()` para usar seus dados reais
2. **Mudar cores**: Altere as cores nos dicionários de cores de cada função
3. **Ajustar critérios**: Modifique os critérios de evento (temp_min, precipitation_max, etc)
4. **Adicionar gráficos**: Crie novas funções `plot_N_*()` seguindo o padrão existente

## 📖 Como Usar na Documentação

### Para o GitHub/Website:
```markdown
![Temperature Analysis](visualizations/01_temperature_timeseries.png)
```

### Para Apresentações:
Use os arquivos PNG de alta resolução (300 DPI) diretamente no PowerPoint ou Google Slides.

### Para Papers:
Os gráficos estão otimizados para impressão em publicações acadêmicas.

## 🔧 Requisitos do Sistema

- Python 3.8+
- 50MB de espaço em disco (para bibliotecas)
- Funciona em Windows, macOS e Linux

## 📝 Notas

- Os dados gerados são simulados para demonstração
- Para usar dados reais, integre com a NASA POWER API
- Todos os gráficos seguem boas práticas de visualização científica
- Cores otimizadas para daltonismo (verde/azul/laranja/vermelho)

## 🤝 Contribuindo

Para adicionar novos tipos de gráficos:

1. Crie uma nova função `plot_N_nome_do_grafico()`
2. Siga o padrão de nomenclatura existente
3. Salve em `OUTPUT_DIR` com numeração sequencial
4. Adicione print de confirmação

## 📚 Referências

- Matplotlib Documentation: https://matplotlib.org/
- Seaborn Gallery: https://seaborn.pydata.org/examples/
- NASA POWER API: https://power.larc.nasa.gov/

---

*Criado para NASA Space Apps Challenge 2025*
*Projeto: Climate-Based Event Planning System*
