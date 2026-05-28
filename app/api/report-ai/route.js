import { NextResponse } from 'next/server'

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY não configurada. Adicione a variável no Vercel.' },
      { status: 503 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const { client, period, performance, contents, approvals } = body

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
(2-3 frases sobre o estado geral do cliente)

## Destaques Positivos
(bullet points com os pontos fortes do período)

## Pontos de Atenção
(bullet points com riscos, quedas ou gargalos identificados)

## Análise de Conteúdo
(análise qualitativa sobre volume, formatos e pipeline)

## Recomendações Estratégicas
(3-5 ações concretas para o próximo período, baseadas nos dados)

## Previsão
(expectativa realista para as próximas semanas com base na tendência)

Seja específico com os números. Não invente dados. Se não houver dados suficientes, indique isso claramente.`

  // Try models in order until one works
  const MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        // 404 = model not found, try next
        if (res.status === 404) continue
        return NextResponse.json(
          { error: `Gemini ${modelName}: ${err?.error?.message ?? res.statusText}` },
          { status: 502 }
        )
      }

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        return NextResponse.json({ error: 'Resposta vazia da IA.' }, { status: 502 })
      }
      return NextResponse.json({ analysis: text, model: modelName })

    } catch (err) {
      console.error(`[report-ai] ${modelName}:`, err?.message)
      continue
    }
  }

  return NextResponse.json(
    { error: 'Nenhum modelo Gemini disponível para esta chave. Verifique se a chave é válida e tem a Gemini API habilitada.' },
    { status: 502 }
  )
}
