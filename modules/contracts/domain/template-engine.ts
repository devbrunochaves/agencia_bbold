/**
 * Centralized {{placeholder}} rendering — the only place in the codebase
 * that does token substitution for contracts, used identically by the live
 * preview (client-side, per keystroke) and by the final content_snapshot
 * saved on the server. Unknown placeholders render as an empty string
 * rather than leaking `{{token}}` into a legal document.
 */
export type TemplateValues = Record<string, string>;

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplate(content: string, values: TemplateValues): string {
  return content.replace(PLACEHOLDER_PATTERN, (_match, key: string) => values[key] ?? "");
}

export function extractPlaceholders(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(PLACEHOLDER_PATTERN)) {
    found.add(match[1]);
  }
  return [...found];
}

/** Used only when no template is selected/available — a contract always needs some content_snapshot. */
export const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{client_legal_name}}, inscrito(a) sob o documento {{client_document}}, com endereço em {{client_address}}, doravante denominado CONTRATANTE.

CONTRATADA: {{contractor_legal_name}}, inscrita sob o documento {{contractor_document}}, com endereço em {{contractor_address}}, doravante denominada CONTRATADA.

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem por objeto a prestação do serviço de {{service_name}} pela CONTRATADA à CONTRATANTE, conforme descrito a seguir: {{description}}

CLÁUSULA 2ª — DO VALOR E DA FORMA DE PAGAMENTO
Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de {{contract_value}}, na modalidade {{billing_type}}, através de {{payment_method}}, em {{installments}} parcela(s).

CLÁUSULA 3ª — DA VIGÊNCIA
O presente contrato vigora a partir de {{start_date}}{{end_date}}.

CLÁUSULA 4ª — DO FORO
Fica eleito o foro da comarca de {{city}} para dirimir quaisquer dúvidas oriundas deste contrato.

E por estarem justas e contratadas, firmam o presente instrumento.

{{city}}, {{signature_date}}.


_______________________________
{{client_legal_name}} — CONTRATANTE


_______________________________
{{contractor_legal_name}} — CONTRATADA`;
