export type Projeto = {
  slug: string;
  titulo: string;
  cliente: string;
  nicho: string;
  descricaoCurta: string;
  descricaoCompleta: string;
  servicos: string[];
  resultados: { label: string; valor: string }[];
  coverImage: string;
  imagens: string[];
  ano: string;
  destaque: boolean;
};

export const projetos: Projeto[] = [
  {
    slug: "escritorio-advocacia",
    titulo: "Escritório de Advocacia",
    cliente: "Dr. Rafael Mendes",
    nicho: "Advocacia",
    descricaoCurta: "Identidade visual moderna e site institucional para escritório de advocacia em Vitória/ES.",
    descricaoCompleta:
      "O Dr. Rafael precisava de uma presença digital que transmitisse autoridade e confiança para seus clientes. Desenvolvemos uma identidade visual sólida, um site institucional rápido e otimizado para SEO, além de uma estratégia de conteúdo para o Google Meu Negócio que triplicou as buscas locais pelo escritório.",
    servicos: ["Identidade Visual", "Site Institucional", "Google Meu Negócio", "SEO"],
    resultados: [
      { label: "Aumento de contatos", valor: "+180%" },
      { label: "Posição no Google", valor: "Top 3" },
      { label: "Prazo de entrega", valor: "21 dias" },
    ],
    coverImage: "/img/projetos/advocacia-cover.jpg",
    imagens: [],
    ano: "2025",
    destaque: true,
  },
  {
    slug: "clinica-nutricao",
    titulo: "Clínica de Nutrição",
    cliente: "Gabriela Nutrição",
    nicho: "Saúde & Nutrição",
    descricaoCurta: "Branding completo, landing page de alta conversão e gestão de redes sociais para nutricionista.",
    descricaoCompleta:
      "A Gabriela tinha conhecimento técnico mas precisava traduzir isso em autoridade digital. Criamos uma marca acolhedora e profissional, uma landing page com foco em agendamentos e assumimos as redes sociais com conteúdo educativo. Em 60 dias, a agenda estava lotada.",
    servicos: ["Identidade Visual", "Landing Page", "Social Media", "Tráfego Pago"],
    resultados: [
      { label: "Agendamentos/mês", valor: "+240%" },
      { label: "Seguidores em 60 dias", valor: "+1.200" },
      { label: "Custo por lead", valor: "R$ 4,80" },
    ],
    coverImage: "/img/projetos/nutricao-cover.jpg",
    imagens: [],
    ano: "2025",
    destaque: true,
  },
  {
    slug: "barbearia-kings",
    titulo: "Barbearia Kings",
    cliente: "Kings Barber Shop",
    nicho: "Barbearia",
    descricaoCurta: "Identidade visual urbana, cardápio digital e campanhas de tráfego pago para barbearia premium.",
    descricaoCompleta:
      "A Kings queria se destacar num mercado saturado. Desenvolvemos uma identidade visual forte com referências urbanas e masculinas, um site com sistema de agendamento online integrado ao WhatsApp e campanhas no Meta Ads segmentadas por raio de 5km — lotando a agenda em tempo recorde.",
    servicos: ["Identidade Visual", "Site + Agendamento", "Meta Ads", "Social Media"],
    resultados: [
      { label: "Clientes novos/mês", valor: "+85" },
      { label: "ROI das campanhas", valor: "8x" },
      { label: "Avaliações Google", valor: "4.9 ★" },
    ],
    coverImage: "/img/projetos/barbearia-cover.jpg",
    imagens: [],
    ano: "2026",
    destaque: true,
  },
  {
    slug: "loja-moda-feminina",
    titulo: "Loja de Moda Feminina",
    cliente: "Bella Moda",
    nicho: "Moda & Varejo",
    descricaoCurta: "E-commerce, identidade visual e gestão completa de redes sociais para loja de moda.",
    descricaoCompleta:
      "A Bella Moda precisava de um salto digital: sair do Instagram manual para um e-commerce profissional com identidade forte. Criamos a marca, o site de vendas e assumimos toda a comunicação visual das redes — resultando num crescimento consistente de receita mês a mês.",
    servicos: ["Identidade Visual", "E-commerce", "Social Media", "Tráfego Pago"],
    resultados: [
      { label: "Faturamento online", valor: "+320%" },
      { label: "Ticket médio", valor: "+45%" },
      { label: "Seguidores Instagram", valor: "+3.400" },
    ],
    coverImage: "/img/projetos/moda-cover.jpg",
    imagens: [],
    ano: "2026",
    destaque: false,
  },
  {
    slug: "clinica-estetica",
    titulo: "Clínica de Estética",
    cliente: "Espaço Beleza",
    nicho: "Estética & Beleza",
    descricaoCurta: "Rebranding completo, site com agendamento e campanhas de Google Ads para clínica de estética.",
    descricaoCompleta:
      "A clínica tinha 5 anos de mercado mas uma identidade visual desatualizada que não refletia a qualidade dos serviços. Fizemos um rebranding elegante, um novo site com agendamento online e campanhas no Google Ads focadas em procedimentos de alto ticket — mais que dobrando o faturamento.",
    servicos: ["Rebranding", "Site + Agendamento", "Google Ads", "Google Meu Negócio"],
    resultados: [
      { label: "Faturamento", valor: "+210%" },
      { label: "Novos clientes/mês", valor: "+60" },
      { label: "Posição Google Maps", valor: "Top 1" },
    ],
    coverImage: "/img/projetos/estetica-cover.jpg",
    imagens: [],
    ano: "2026",
    destaque: false,
  },
  {
    slug: "restaurante-italiano",
    titulo: "Restaurante Italiano",
    cliente: "Trattoria Bella",
    nicho: "Gastronomia",
    descricaoCurta: "Cardápio digital, identidade visual e campanhas de tráfego pago para restaurante italiano.",
    descricaoCompleta:
      "A Trattoria precisava de uma comunicação visual à altura da qualidade da sua cozinha. Desenvolvemos uma identidade que traduzia a sofisticação italiana em design moderno, um cardápio digital com QR Code, gerenciamos as redes com fotos profissionais dos pratos e campanhas segmentadas para aumentar as reservas.",
    servicos: ["Identidade Visual", "Cardápio Digital", "Social Media", "Meta Ads"],
    resultados: [
      { label: "Reservas online", valor: "+150%" },
      { label: "Engajamento Instagram", valor: "+400%" },
      { label: "Avaliações positivas", valor: "98%" },
    ],
    coverImage: "/img/projetos/restaurante-cover.jpg",
    imagens: [],
    ano: "2026",
    destaque: false,
  },
];

export function getProjetoBySlug(slug: string): Projeto | undefined {
  return projetos.find((p) => p.slug === slug);
}

export function getProjetosDestaque(): Projeto[] {
  return projetos.filter((p) => p.destaque);
}
