import { User, PrayerRequest, Cell, Contribution, ChurchEvent, BibleBook, ChurchStudy, RadioProgram } from './types';

export const INITIAL_USER: User = {
  name: 'Gabriel Silva',
  category: 'Membro Comungante',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c',
  planCount: 12,
  prayerCount: 5,
  eventCount: 3,
  email: 'gabriel.silva@email.com',
  phone: '(11) 98765-4321',
  birthDate: '1990-04-15',
  address: 'Alameda Lorena, 880 - Jardins, São Paulo',
  ministry: 'Som & Mídia',
};

export const INITIAL_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'pr-1',
    category: 'Saúde',
    title: 'Recuperação do Sr. José',
    description: 'Pela recuperação do Sr. José, que está passando por uma cirurgia cardíaca amanhã. Que as mãos do Senhor guiem os médicos.',
    timeAgo: 'há 2 horas',
    count: 12,
    visibilidade: 'Público',
    userOred: false,
    authorName: 'Ana Souza',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFzVPt8R12b6r0cJenxhGMSaRCVhnj5m2I1L63zIXLkZLH0Irma2hv_P5qK-GMNH3b3kCM43ZW9Q4PH9K2SiHy7-ODE2cNb2t8A_zr-BxvnChqsgjZT1LXBuf2HL7pp1fSDQrGvEk4mrCFhimqMvSUYOfz3wbz8iN8rRH9nRmA9gRdo6n7D4xRFLdEgI2ndKUZKvYauk-Nvw84QWoH51RjXus-LV6oWVbwI4n3EBJX3_zjwxm5Rnn2tM0Qd7UVF_wjMD9kxH-nvnE',
    aprovado: true,
  },
  {
    id: 'pr-2',
    category: 'Gratidão',
    title: 'Porta de emprego aberta',
    description: 'Agradeço a Deus pela porta de emprego que se abriu após 6 meses de espera. Ele é fiel em todo o tempo!',
    timeAgo: 'há 5 horas',
    count: 5,
    visibilidade: 'Público',
    userOred: false,
    authorName: 'Marcos Oliveira',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB17FMtiuULNqk4h9CsuAGoM84ej4v-4k9DSAWBlDBBR7GmKPkUJNV7sXpxg4pAmT4Oh8bfnkx9sR3Cevp6WQSic9H6FOCXaegaeGAW0WNxHj1JQNER3LvwvI1jYDabpduh0sWKZ1riE8c5CX4RKMdgHgoOYM7xxJlaZGT7mzRrZ_PUGg0AWvefB6_QEthHc9yeiSMn0zjNpX2W5J8Ktsq-ilqO2J2WxcnDAyi3pL1HFiG5RPWH5YRGgwZVaGdaSA3Z-GPbQBUwEpo',
    aprovado: true,
  },
  {
    id: 'pr-3',
    category: 'Família',
    title: 'Restauração Familiar',
    description: 'Peço oração pela conversão dos meus pais e harmonia no nosso lar sob as bênçãos e sabedoria de Cristo.',
    timeAgo: 'há 1 dia',
    count: 18,
    visibilidade: 'Público',
    userOred: true,
    authorName: 'Gabriel Silva',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c',
    aprovado: true,
  },
  {
    id: 'pr-4',
    category: 'Espiritual',
    title: 'Sabedoria para o Ministério',
    description: 'Pedido especial para liderança e pastores, que tenham discernimento diário para conduzir o rebanho com amor e justiça.',
    timeAgo: 'há 2 dias',
    count: 24,
    visibilidade: 'Pastoral',
    userOred: false,
    authorName: 'Rev. Roberto Silva',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuon_BcHB_Ezo-GyWZ4hI-1tjYM4D6R-6QVR--h_YLSfgJfuNoAT3D0dR408jAte4iIR0YX8DdMjjf0WAB3LLf3TAWhS1m7wiEBEDhq3OQcSfcr6PAHPuqJJVOzJgNQ33o9TfbzR4PdJH1l80RMEMIT12VASsOkJWWinfpRqgIbPOOyKpSID2uqnTDnoXb6sYsYUf6k96KI6liIkZetYGqEYosB2wWAyfX4as38eya06G77-a3LNEJOmx1t2NNHu0-NXCsW1orVPs',
    aprovado: true,
  }
];

export const INITIAL_CELLS: Cell[] = [
  {
    id: 'c-1',
    title: 'Célula Manancial',
    leaderName: 'Pr. Roberto Silva',
    leaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuon_BcHB_Ezo-GyWZ4hI-1tjYM4D6R-6QVR--h_YLSfgJfuNoAT3D0dR408jAte4iIR0YX8DdMjjf0WAB3LLf3TAWhS1m7wiEBEDhq3OQcSfcr6PAHPuqJJVOzJgNQ33o9TfbzR4PdJH1l80RMEMIT12VASsOkJWWinfpRqgIbPOOyKpSID2uqnTDnoXb6sYsYUf6k96KI6liIkZetYGqEYosB2wWAyfX4as38eya06G77-a3LNEJOmx1t2NNHu0-NXCsW1orVPs',
    schedule: 'Terças, 20h00',
    address: 'Av. Brigadeiro Faria Lima, 1400',
    neighborhood: 'Itaim Bibi',
    distance: '1.2km de você',
    joined: false,
    city: 'São Paulo',
  },
  {
    id: 'c-2',
    title: 'Célula Esperança',
    leaderName: 'Mariana Costa',
    leaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwMFOR1-S8r3O0yeiDVvvMPIYoLP2CeqldTMEJElvpJHEFHLHyZZgWv09G2D_T36_Iz1b6VEOpAyJfgIG7Q7DhbLmI3SpcWEJXZpXUvPu4gzWW9OhbLLNZ_QvlC9fft79gGoODt5NvH9eENBpsLN93p2pGaGO68vBvpLwKaNIe9fCQOFICc4asrFon6OfHBkJeisyMhpyBHfCoi6NnHSPusAhVe6wSWUuJ7ezMh35kMKq5s-Lhkin1sRxSImNs2mhF_H9RJSzeO6c',
    schedule: 'Quartas-feiras, 19h30',
    address: 'Rua Tuim, 450',
    neighborhood: 'Moema',
    distance: '3.4km de você',
    joined: false,
    city: 'São Paulo',
  },
  {
    id: 'c-3',
    title: 'Célula Betel',
    leaderName: 'Carlos Eduardo',
    leaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWAlH_vipGXQtVVQjn17uImjA15wHYmK7vtaoUMVeeHPHYxndlot2l40s-7Wwk1n4CFVMms_xQiCD9GaxqQxBmLv0LRRE-sYH9A32UJ-SI6aCcWQnOGC5KtYPeku_tOLXUa05-qOMq_STU0DNuQDOEGDP4kDvbewh8B2yxizRVCDwpGCBz8KkBorce1PN_rFQg5bykTOCzQsqkQe3f1zGy7FEIycY4l5_LCA5zClLqiVk1mtw-84Q_yrQqlfzmR-2Yv9D-x0IHmME',
    schedule: 'Sábados, 18h00',
    address: 'Av. Brasil, 1200',
    neighborhood: 'Pinheiros',
    distance: '2.1km de você',
    joined: false,
    city: 'São Paulo',
  },
  {
    id: 'c-4',
    title: 'Célula Refúgio',
    leaderName: 'Gabriel Silva',
    leaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAw9f0m9zhnseECjh851sbC_y6zLT72KxZLFVCXdRwDIWH1CC-47FIiUxUXqTuB95Spni3XDvS7u1c-glbKjtQ2aiQke9uLjXjx-PV80NSNENNsu_daFFwxaV4mbyOOaA9-ScMxItwTnqLmvpGA-Dd2xJWBIz5zJZspCQG6fQDPZ6kwo3E_MeyjhrwVP4B2tYvr6V3HBeiGN899eENqjHE6bBz6N_K14zK1XoogBk6NAT1WsQyx2fJXpIuYiRJK92dLfb6Zkrbf9c',
    schedule: 'Quintas, 20h00',
    address: 'Alameda Lorena, 880',
    neighborhood: 'Jardins',
    distance: '1.8km de você',
    joined: true,
    city: 'São Paulo',
  }
];

export const INITIAL_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'cont-1',
    title: 'Dízimo Mensal',
    date: '12 de Outubro, 2026',
    amountVal: 450.00,
    category: 'Dízimo',
    method: 'Pix',
  },
  {
    id: 'cont-2',
    title: 'Oferta Especial',
    date: '05 de Outubro, 2026',
    amountVal: 50.00,
    category: 'Oferta',
    method: 'Pix',
  }
];

export const INITIAL_EVENTS: ChurchEvent[] = [];

export const BIBLE_BOOKS: BibleBook[] = [
  { name: 'Gênesis', abbrev: 'Gn', chapters: 50 },
  { name: 'Salmos', abbrev: 'Sl', chapters: 150 },
  { name: 'Provérbios', abbrev: 'Pv', chapters: 31 },
  { name: 'Mateus', abbrev: 'Mt', chapters: 28 },
  { name: 'Marcos', abbrev: 'Mc', chapters: 16 },
  { name: 'Lucas', abbrev: 'Lc', chapters: 24 },
  { name: 'João', abbrev: 'Jo', chapters: 21 },
  { name: 'Atos', abbrev: 'At', chapters: 28 },
  { name: 'Romanos', abbrev: 'Rm', chapters: 16 },
  { name: 'Efésios', abbrev: 'Ef', chapters: 6 },
  { name: 'Filipenses', abbrev: 'Fp', chapters: 4 },
  { name: 'Apocalipse', abbrev: 'Ap', chapters: 22 },
];

export const MOCK_VERSES: Record<string, string[]> = {
  'Fp-4': [
    'Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos.',
    'Seja a vossa equidade notória a todos os homens. Perto está o Senhor.',
    'Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e súplica com ações de graças.',
    'E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.',
    'Quanto ao mais, irmãos, tudo o que é verdadeiro, tudo o que é honesto, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se há alguma virtude, e se há algum louvor, nisso pensai.'
  ],
  'Sl-121': [
    'Elevo os meus olhos para os montes; de onde me virá o socorro?',
    'O meu socorro vem do Senhor, que fez os céus e a terra.',
    'Não deixará vacilar o teu pé; aquele que te guarda não tosquenejará.',
    'Eis que não tosquenejará nem dormirá o guarda de Israel.',
    'O Senhor é quem te guarda; o Senhor é a tua sombra à tua mão direita.',
    'O sol não te molestará de dia nem a lua de noite.',
    'O Senhor te guardará de todo o mal; guardará a tua alma.',
    'O Senhor guardará a tua entrada e a tua saída, desde agora e para sempre.'
  ],
  'Sl-23': [
    'O Senhor é o meu pastor, nada me faltará.',
    'Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.',
    'Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.',
    'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.',
    'Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.',
    'Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.'
  ]
};

export const INITIAL_STUDIES: ChurchStudy[] = [
  {
    id: 'st-1',
    title: 'A Importância da Fé no Século XXI',
    authorName: 'Pastor Roberto Silva',
    dateStr: '25 de Maio, 2026',
    content: 'Este estudo aborda os desafios da vivência cristã na sociedade moderna. Veremos como manter firme a nossa esperança e comunhão, mesmo diante das pressões tecnológicas e culturais de nossa era. O texto bíblico base é Romanos 12:1-2: "Não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus".\n\nPontos de reflexão:\n1. O que nos afasta da simplicidade do Evangelho?\n2. Como as redes sociais impactam nossa vida devocional?\n3. O valor da comunidade local como refúgio espiritual.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    attachmentName: 'Guia_de_Reflexao_Dezembro.pdf',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audioName: 'podcast_estudo_importancia_da_fe.mp3',
    tags: ['Fé', 'Teologia', 'Sociedade']
  },
  {
    id: 'st-2',
    title: 'Estudo de Célula: Vivendo em Comunhão',
    authorName: 'Presbítero Fabio Nunes',
    dateStr: '20 de Maio, 2026',
    content: 'A vida cristã não foi desenhada para ser vivida de forma isolada. Atos 2 retrata uma igreja viva que compartilhava o pão, orava em conjunto e tinha tudo em comum. Neste roteiro de pequenos grupos, exploramos o impacto prático de estarmos em comunhão íntima e sincera dentro das células semanais.\n\nPerguntas para compartilhar na Célula:\n- Compartilhe uma experiência em que a célula lhe deu apoio emocional ou espiritual.\n- Como podemos tornar nossas reuniões ainda mais acolhedoras para novos visitantes?',
    videoUrl: 'https://www.youtube.com/watch?v=2g811Eo7K8U',
    attachmentName: 'Roteiro_Grupo_Pequeno.pdf',
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audioName: 'vivendo_em_comunhao_podcast.mp3',
    tags: ['Comunhão', 'Célula', 'Família']
  }
];

export const INITIAL_RADIO_PROGRAMS: RadioProgram[] = [
  {
    id: 'rad-1',
    title: 'Momento de Devocional e Oração',
    speaker: 'Pastor Roberto Silva',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    audioName: 'momento_oracao_matinal.mp3',
    scheduledTime: 'Diariamente às 07h00',
    tags: ['Oração', 'Devocional', 'Manhã'],
    createdAt: '2026-05-27T07:00:00Z'
  },
  {
    id: 'rad-2',
    title: 'Voz Presbiteriana Aquarius',
    speaker: 'Presb. Fabio Nunes',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    audioName: 'transmissao_conferencia.mp3',
    scheduledTime: 'Quartas às 20h00',
    tags: ['Teologia', 'Estudo', 'Mensagem'],
    createdAt: '2026-05-26T20:00:00Z'
  }
];

