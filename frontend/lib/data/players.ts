export interface MockPlayer {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  image_url: string | null;
  nationality: string;
  role: string;
  team: {
    id: number;
    name: string;
    acronym: string;
    image_url: string | null;
    location: string;
    color: string;
  };
  stats: {
    rating: number;
    kd_ratio: number;
    adr: number;
    headshot_percentage: number;
    kast: number;
  };
  price: number;
}

export const MOCK_TEAMS = [
  { id: 1, name: "FURIA", acronym: "FUR", location: "BR", color: "#FF6B00", image_url: "https://cdn-api.pandascore.co/images/team/image/124530/furia.png" },
  { id: 2, name: "NAVI", acronym: "NAV", location: "UA", color: "#FFD700", image_url: "https://cdn-api.pandascore.co/images/team/image/2593/natus-vincere.png" },
  { id: 3, name: "FaZe", acronym: "FaZe", location: "EU", color: "#00D4FF", image_url: "https://cdn-api.pandascore.co/images/team/image/2672/faze-clan.png" },
  { id: 4, name: "Vitality", acronym: "VIT", location: "FR", color: "#8B5CF6", image_url: "https://cdn-api.pandascore.co/images/team/image/2167/vitality.png" },
  { id: 5, name: "G2", acronym: "G2", location: "EU", color: "#FF4444", image_url: "https://cdn-api.pandascore.co/images/team/image/2174/g2-esports.png" },
];

export const MOCK_PLAYERS: MockPlayer[] = [
  // FURIA
  {
    id: 1001,
    name: "KSCERATO",
    first_name: "Kaike",
    last_name: "Cerato",
    image_url: null,
    nationality: "BR",
    role: "Rifler",
    team: { ...MOCK_TEAMS[0] },
    stats: { rating: 1.21, kd_ratio: 1.35, adr: 78.4, headshot_percentage: 52.1, kast: 74.3 },
    price: 280,
  },
  {
    id: 1002,
    name: "FalleN",
    first_name: "Gabriel",
    last_name: "Toledo",
    image_url: null,
    nationality: "BR",
    role: "AWPer",
    team: { ...MOCK_TEAMS[0] },
    stats: { rating: 1.15, kd_ratio: 1.22, adr: 74.1, headshot_percentage: 38.5, kast: 72.1 },
    price: 260,
  },
  {
    id: 1003,
    name: "chelo",
    first_name: "Rafael",
    last_name: "Siqueira",
    image_url: null,
    nationality: "BR",
    role: "Rifler",
    team: { ...MOCK_TEAMS[0] },
    stats: { rating: 1.08, kd_ratio: 1.12, adr: 71.2, headshot_percentage: 48.3, kast: 70.5 },
    price: 210,
  },
  {
    id: 1004,
    name: "skullz",
    first_name: "Felipe",
    last_name: "Medeiros",
    image_url: null,
    nationality: "BR",
    role: "Rifler",
    team: { ...MOCK_TEAMS[0] },
    stats: { rating: 1.04, kd_ratio: 1.08, adr: 68.5, headshot_percentage: 44.2, kast: 69.8 },
    price: 190,
  },
  {
    id: 1005,
    name: "yuurih",
    first_name: "Yuri",
    last_name: "Santos",
    image_url: null,
    nationality: "BR",
    role: "Rifler",
    team: { ...MOCK_TEAMS[0] },
    stats: { rating: 1.18, kd_ratio: 1.28, adr: 76.3, headshot_percentage: 50.7, kast: 73.2 },
    price: 240,
  },

  // NAVI
  {
    id: 2001,
    name: "s1mple",
    first_name: "Oleksandr",
    last_name: "Kostyliev",
    image_url: null,
    nationality: "UA",
    role: "AWPer",
    team: { ...MOCK_TEAMS[1] },
    stats: { rating: 1.38, kd_ratio: 1.52, adr: 89.1, headshot_percentage: 41.2, kast: 77.4 },
    price: 300,
  },
  {
    id: 2002,
    name: "b1t",
    first_name: "Valerii",
    last_name: "Vakhovskyi",
    image_url: null,
    nationality: "UA",
    role: "Rifler",
    team: { ...MOCK_TEAMS[1] },
    stats: { rating: 1.12, kd_ratio: 1.18, adr: 72.8, headshot_percentage: 55.3, kast: 71.6 },
    price: 220,
  },
  {
    id: 2003,
    name: "electronic",
    first_name: "Denis",
    last_name: "Sharipov",
    image_url: null,
    nationality: "RU",
    role: "Rifler",
    team: { ...MOCK_TEAMS[1] },
    stats: { rating: 1.16, kd_ratio: 1.24, adr: 75.1, headshot_percentage: 47.8, kast: 72.9 },
    price: 235,
  },
  {
    id: 2004,
    name: "Perfecto",
    first_name: "Ilya",
    last_name: "Zalutskiy",
    image_url: null,
    nationality: "RU",
    role: "Support",
    team: { ...MOCK_TEAMS[1] },
    stats: { rating: 1.05, kd_ratio: 1.09, adr: 67.3, headshot_percentage: 42.1, kast: 73.5 },
    price: 175,
  },
  {
    id: 2005,
    name: "iM",
    first_name: "Danil",
    last_name: "Ishutin",
    image_url: null,
    nationality: "UA",
    role: "IGL",
    team: { ...MOCK_TEAMS[1] },
    stats: { rating: 1.02, kd_ratio: 1.05, adr: 64.2, headshot_percentage: 38.9, kast: 70.1 },
    price: 160,
  },

  // FaZe
  {
    id: 3001,
    name: "ropz",
    first_name: "Robin",
    last_name: "Kool",
    image_url: null,
    nationality: "EE",
    role: "Rifler",
    team: { ...MOCK_TEAMS[2] },
    stats: { rating: 1.24, kd_ratio: 1.38, adr: 80.2, headshot_percentage: 53.4, kast: 75.8 },
    price: 270,
  },
  {
    id: 3002,
    name: "broky",
    first_name: "Helvijs",
    last_name: "Saukants",
    image_url: null,
    nationality: "LV",
    role: "AWPer",
    team: { ...MOCK_TEAMS[2] },
    stats: { rating: 1.19, kd_ratio: 1.31, adr: 77.6, headshot_percentage: 39.2, kast: 73.4 },
    price: 255,
  },
  {
    id: 3003,
    name: "karrigan",
    first_name: "Finn",
    last_name: "Andersen",
    image_url: null,
    nationality: "DK",
    role: "IGL",
    team: { ...MOCK_TEAMS[2] },
    stats: { rating: 1.02, kd_ratio: 1.05, adr: 65.4, headshot_percentage: 41.7, kast: 71.2 },
    price: 180,
  },
  {
    id: 3004,
    name: "rain",
    first_name: "Håvard",
    last_name: "Nygaard",
    image_url: null,
    nationality: "NO",
    role: "Rifler",
    team: { ...MOCK_TEAMS[2] },
    stats: { rating: 1.13, kd_ratio: 1.21, adr: 73.5, headshot_percentage: 49.6, kast: 71.8 },
    price: 225,
  },
  {
    id: 3005,
    name: "frozen",
    first_name: "David",
    last_name: "Cernansky",
    image_url: null,
    nationality: "SK",
    role: "Rifler",
    team: { ...MOCK_TEAMS[2] },
    stats: { rating: 1.17, kd_ratio: 1.26, adr: 74.9, headshot_percentage: 51.3, kast: 72.7 },
    price: 240,
  },

  // Vitality
  {
    id: 4001,
    name: "ZywOo",
    first_name: "Mathieu",
    last_name: "Herbaut",
    image_url: null,
    nationality: "FR",
    role: "AWPer",
    team: { ...MOCK_TEAMS[3] },
    stats: { rating: 1.35, kd_ratio: 1.48, adr: 87.3, headshot_percentage: 40.5, kast: 76.9 },
    price: 295,
  },
  {
    id: 4002,
    name: "apEX",
    first_name: "Dan",
    last_name: "Madesclaire",
    image_url: null,
    nationality: "FR",
    role: "IGL",
    team: { ...MOCK_TEAMS[3] },
    stats: { rating: 1.01, kd_ratio: 1.04, adr: 63.8, headshot_percentage: 43.2, kast: 69.4 },
    price: 155,
  },
  {
    id: 4003,
    name: "mezii",
    first_name: "William",
    last_name: "Merriman",
    image_url: null,
    nationality: "GB",
    role: "Rifler",
    team: { ...MOCK_TEAMS[3] },
    stats: { rating: 1.11, kd_ratio: 1.17, adr: 71.8, headshot_percentage: 46.9, kast: 71.3 },
    price: 215,
  },
  {
    id: 4004,
    name: "flameZ",
    first_name: "Shahar",
    last_name: "Shushan",
    image_url: null,
    nationality: "IL",
    role: "Rifler",
    team: { ...MOCK_TEAMS[3] },
    stats: { rating: 1.14, kd_ratio: 1.20, adr: 73.2, headshot_percentage: 50.1, kast: 72.5 },
    price: 230,
  },
  {
    id: 4005,
    name: "Spinx",
    first_name: "Dorian",
    last_name: "Berman",
    image_url: null,
    nationality: "IL",
    role: "Rifler",
    team: { ...MOCK_TEAMS[3] },
    stats: { rating: 1.16, kd_ratio: 1.23, adr: 74.5, headshot_percentage: 52.8, kast: 73.1 },
    price: 240,
  },

  // G2
  {
    id: 5001,
    name: "NiKo",
    first_name: "Nikola",
    last_name: "Kovac",
    image_url: null,
    nationality: "BA",
    role: "Rifler",
    team: { ...MOCK_TEAMS[4] },
    stats: { rating: 1.28, kd_ratio: 1.42, adr: 83.7, headshot_percentage: 54.6, kast: 75.2 },
    price: 285,
  },
  {
    id: 5002,
    name: "m0NESY",
    first_name: "Ilya",
    last_name: "Osipov",
    image_url: null,
    nationality: "RU",
    role: "AWPer",
    team: { ...MOCK_TEAMS[4] },
    stats: { rating: 1.30, kd_ratio: 1.44, adr: 85.2, headshot_percentage: 38.7, kast: 75.8 },
    price: 290,
  },
  {
    id: 5003,
    name: "huNter",
    first_name: "Nemanja",
    last_name: "Kovac",
    image_url: null,
    nationality: "BA",
    role: "Rifler",
    team: { ...MOCK_TEAMS[4] },
    stats: { rating: 1.14, kd_ratio: 1.20, adr: 73.8, headshot_percentage: 51.4, kast: 72.3 },
    price: 230,
  },
  {
    id: 5004,
    name: "jks",
    first_name: "Justin",
    last_name: "Savage",
    image_url: null,
    nationality: "AU",
    role: "Rifler",
    team: { ...MOCK_TEAMS[4] },
    stats: { rating: 1.12, kd_ratio: 1.18, adr: 72.1, headshot_percentage: 48.3, kast: 71.5 },
    price: 220,
  },
  {
    id: 5005,
    name: "HooXi",
    first_name: "Marco",
    last_name: "Hoots",
    image_url: null,
    nationality: "DK",
    role: "IGL",
    team: { ...MOCK_TEAMS[4] },
    stats: { rating: 0.98, kd_ratio: 1.01, adr: 61.5, headshot_percentage: 40.2, kast: 68.9 },
    price: 145,
  },
];

// Calcular cor do rating
export function getRatingColor(rating: number): string {
  if (rating >= 1.25) return "#FFD700";
  if (rating >= 1.10) return "#39A900";
  if (rating >= 1.00) return "#94a3b8";
  return "#ef4444";
}

// Flag emoji por nacionalidade
export function getFlagEmoji(nationality: string): string {
  const flags: Record<string, string> = {
    BR: "🇧🇷", UA: "🇺🇦", RU: "🇷🇺", EE: "🇪🇪",
    LV: "🇱🇻", DK: "🇩🇰", NO: "🇳🇴", SK: "🇸🇰",
    FR: "🇫🇷", GB: "🇬🇧", IL: "🇮🇱", BA: "🇧🇦", AU: "🇦🇺",
  };
  return flags[nationality] || "🌍";
}