import { NextResponse } from 'next/server'

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY não configurada. Adicione a variável no Vercel.' },
      { status: 503 }
    )
  }

  const { client, period, performance, contents, approvals } = await request.json()

  const perfSummary = performance.length === 0
    ? 'Nenhuma métrica registrada neste período.'
    : performance.map(m =>
        `• ${m.metric}: ${m.records.map(r => `${r.date}=${r.value}`).join(', ')} ` +
        `(variação total: ${m.totalGrowth !== null ? `${m.totalGrowth.toFixed(1)}%` : 'base'})`
      ).join('\n')

  const contentSummary = contents.length === 0
    ? 'Nenhum conteúdo criado neste período.'
    : contents.map(c => `• [${c.status}] ${c.title} (${c.format}${c.pubDate ? ', pub: ' + c.pubDate : ''})`).join('\n')

  const approvalSummary = approvals.length === 0
    ? 'Nenhuma aprovação neste período.'
    : approvals.map(a => `• [${a.status}] ${a.title} — ${a.priority}`).join('\n')

  const prompt = `Você é um analista sênior de marketing digital especializado em agências criativas.
Analise os dados abaixo do cliente "${client.name}" (nicho: ${client.niche}, plano: ${client.plan})
para o período de ${period.start} a ${period.end}.

MÉTRICAS DE PERFORMANCE:
${perfSummary}

CONTEÚDOS PRODUZIDOS:
${contentSummary}

APROVAÇÕES:
${approvalSummary}

Escreva uma análise completa em português do Brasil, com tom profissional mas direto. Estruture assim:

## Resumo Executivo
## Destaques Positivos
## Pontos de Atenção
## Análise de Conteúdo
## Recomendações Estratégicas
## Previsão

Seja específico com os números. Não invente dados.`

  const MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro',
  ]

  for (const modelName of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      })
      if (res.status === 404) continue
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return NextResponse.json({ error: `Gemini ${modelName}: ${err?.error?.message ?? res.statusText}` }, { status: 502 })
      }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) return NextResponse.json({ error: 'Resposta vazia da IA.' }, { status: 502 })
      return NextResponse.json({ analysis: text, model: modelName })
    } catch (err) {
      continue
    }
  }

  return NextResponse.json(
    { error: 'Nenhum modelo Gemini disponível. Verifique se a chave GEMINI_API_KEY é válida.' },
    { status: 502 }
  )
}
