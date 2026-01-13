import { useState, useEffect, useRef, useCallback } from 'react';

// --- TYPES ---
export type FactionKey = 'tarren' | 'korai' | 'reapers' | 'ascendancy';
export type ResourceType = 'credits' | 'metal' | 'he3' | 'food';
export type Owner = 'player' | string | null;
export type ShipCategory = 'drone' | 'frigate' | 'cruiser' | 'battleship' | 'capitol';

export interface ShipType {
  id: string;
  name: string;
  attack: number;
  defense: number;
  cost: { credits: number; metal: number };
  buildTime: number;
  tier: number; // 0 = starter, 1+ = requires research
}

export interface FactionData {
  name: string;
  color: string;
  secondaryColor: string;
  description: string;
  lore: string;
  motto: string;
  bonuses: { economy: number; combat: number; research: number };
  ships: Record<ShipCategory, ShipType[]>;
}

export interface Planet {
  id: string;
  name: string;
  owner: Owner;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
  type: 'balanced' | 'desert' | 'water' | 'ice' | 'forest' | 'barren' | 'gas';
  baseIncome: number;
  defense: number;
  population: number;
  maxPopulation: number;
  structures: {
    shipyard: number;
    defenseGrid: number;
    miningFacility: number;
    researchLab: number;
  };
}

export interface Fleet {
  id: string;
  x: number;
  y: number;
  ships: Record<string, number>; // Ship ID -> count
  moving: boolean;
  destination: Planet | null;
  owner: Owner;
}

export interface Player {
  faction: FactionKey;
  resources: Record<ResourceType, number>;
  fleets: Fleet[];
  homeworld: string;
  score: number;
}

export interface AIPlayer extends Player {
  id: string;
  name: string;
  difficulty: 'easy' | 'normal' | 'hard';
  personality: 'aggressive' | 'defensive' | 'economic';
}

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface CombatEvent {
  id: number;
  timestamp: number;
  location: string;
  attacker: string;
  defender: string;
  attackerLosses: Record<string, number>;  // Ship ID -> count lost
  defenderLosses: Record<string, number>;  // Ship ID -> count lost
  winner: string;
}

export interface ResearchProject {
  id: string;
  name: string;
  description: string;
  shipUnlockId: string; // ID of specific ship to unlock
  category: ShipCategory;
  cost: { credits: number; he3: number };  // HE3 is fuel for research
  researchTime: number; // ticks to complete
  requiredLab: number; // minimum research lab level
  prerequisites: string[]; // IDs of required research
}

export interface ResearchState {
  completed: string[]; // IDs of completed research
  current: string | null; // Currently researching
  progress: number; // Progress ticks on current research
}

// --- PLANET TYPE MODIFIERS (percentage bonuses/penalties from document) ---
export const PLANET_MODIFIERS: Record<Planet['type'], { metal: number; he3: number; population: number; food: number }> = {
  balanced: { metal: -25, he3: -50, population: 75, food: 50 },
  desert:   { metal: 25, he3: -50, population: -100, food: -100 },
  water:    { metal: 25, he3: -100, population: -100, food: 25 },
  ice:      { metal: -25, he3: 50, population: -100, food: -100 },
  forest:   { metal: 25, he3: -50, population: 50, food: 100 },
  barren:   { metal: 75, he3: -25, population: 50, food: -100 },
  gas:      { metal: -100, he3: 100, population: -100, food: -100 },
};

// --- PLANET NAMES ---
const PLANET_PREFIXES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Omega', 'Nova', 'Proxima', 'Kepler', 'Gliese', 'Tau', 'Sigma', 'Vega', 'Rigel', 'Altair', 'Deneb', 'Sirius', 'Arcturus', 'Polaris', 'Antares', 'Betelgeuse', 'Capella', 'Aldebaran'];
const PLANET_SUFFIXES = ['Prime', 'Major', 'Minor', 'Station', 'Colony', 'Outpost', 'Haven', 'Reach', 'Frontier', 'Gate', 'Hub', 'Nexus', 'Core', 'Edge', 'Point'];
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function generatePlanetName(index: number): string {
  const prefix = PLANET_PREFIXES[index % PLANET_PREFIXES.length];
  const suffix = PLANET_SUFFIXES[Math.floor(index / PLANET_PREFIXES.length) % PLANET_SUFFIXES.length];
  const numeral = ROMAN_NUMERALS[Math.floor(index / (PLANET_PREFIXES.length * PLANET_SUFFIXES.length)) % ROMAN_NUMERALS.length];
  return `${prefix} ${suffix} ${numeral}`.trim();
}

// --- FACTIONS ---
export const FACTIONS: Record<FactionKey, FactionData> = {
  tarren: {
    name: "Tarren Republic",
    color: "#38bdf8",
    secondaryColor: "#0ea5e9",
    description: "Humanity's descendants who left Earth for the stars.",
    lore: "The Tarren are humanity's descendants, though they no longer call themselves human. They left Earth three centuries ago not out of desperation, but ambition. Their culture values discovery, expansion, and the belief that stagnation equals death.",
    motto: "Ad Astra Per Aspera - Through hardships to the stars.",
    bonuses: { economy: 1.2, combat: 1.0, research: 1.15 },
    ships: {
      drone: [
        { id: 'tarren_drone_fodder', name: "Drone Fodder", attack: 0, defense: 1, cost: { credits: 2, metal: 2 }, buildTime: 1, tier: 0 },
        { id: 'tarren_drone_striker', name: "Drone Striker", attack: 1, defense: 1, cost: { credits: 5, metal: 2 }, buildTime: 1, tier: 0 }
      ],
      frigate: [
        { id: 'tarren_wasp', name: "Wasp", attack: 2, defense: 4, cost: { credits: 15, metal: 8 }, buildTime: 2, tier: 1 },
        { id: 'tarren_hornet', name: "Hornet", attack: 3, defense: 5, cost: { credits: 19, metal: 11 }, buildTime: 2, tier: 2 }
      ],
      cruiser: [
        { id: 'tarren_tiger', name: "Tiger", attack: 10, defense: 15, cost: { credits: 100, metal: 18 }, buildTime: 4, tier: 3 },
        { id: 'tarren_wolf', name: "Wolf", attack: 12, defense: 18, cost: { credits: 125, metal: 20 }, buildTime: 4, tier: 4 },
        { id: 'tarren_eagle', name: "Eagle", attack: 15, defense: 20, cost: { credits: 150, metal: 22 }, buildTime: 4, tier: 5 }
      ],
      battleship: [
        { id: 'tarren_freedom', name: "Freedom", attack: 75, defense: 120, cost: { credits: 50000, metal: 1025 }, buildTime: 8, tier: 6 }
      ],
      capitol: [
        { id: 'tarren_titan', name: "Titan", attack: 225, defense: 300, cost: { credits: 106000, metal: 9550 }, buildTime: 15, tier: 7 }
      ]
    }
  },
  korai: {
    name: "Kor'ai Empire",
    color: "#ef4444",
    secondaryColor: "#dc2626",
    description: "Reptilian warriors who believe strength through contest.",
    lore: "The Kor'ai are bipedal reptilians from the high-gravity world of Kora Prime. Their society is built on 'Strength Through Contest' - every aspect of their culture involves ritualized competition. To the Kor'ai, avoiding conflict is cowardice, but escalating beyond agreed boundaries is dishonor.",
    motto: "Kelash Mor'kai - The strong stars shine brightest.",
    bonuses: { economy: 0.9, combat: 1.4, research: 0.95 },
    ships: {
      drone: [
        { id: 'korai_drone_fodder', name: "Drone Fodder", attack: 0, defense: 1, cost: { credits: 2, metal: 2 }, buildTime: 1, tier: 0 },
        { id: 'korai_drone_bomber', name: "Drone Bomber", attack: 2, defense: 1, cost: { credits: 5, metal: 3 }, buildTime: 1, tier: 0 }
      ],
      frigate: [
        { id: 'korai_solar', name: "Solar", attack: 2, defense: 4, cost: { credits: 16, metal: 7 }, buildTime: 2, tier: 1 },
        { id: 'korai_ray', name: "Ray", attack: 3, defense: 5, cost: { credits: 20, metal: 9 }, buildTime: 2, tier: 2 }
      ],
      cruiser: [
        { id: 'korai_fang', name: "Fang", attack: 10, defense: 12, cost: { credits: 140, metal: 22 }, buildTime: 4, tier: 3 },
        { id: 'korai_thorn', name: "Thorn", attack: 12, defense: 15, cost: { credits: 160, metal: 25 }, buildTime: 4, tier: 4 }
      ],
      battleship: [
        { id: 'korai_basilisk', name: "Basilisk", attack: 150, defense: 125, cost: { credits: 75000, metal: 1550 }, buildTime: 8, tier: 5 }
      ],
      capitol: [
        { id: 'korai_venom', name: "Venom", attack: 180, defense: 250, cost: { credits: 100500, metal: 6000 }, buildTime: 15, tier: 6 }
      ]
    }
  },
  reapers: {
    name: "Reaper Clans",
    color: "#a855f7",
    secondaryColor: "#9333ea",
    description: "Scavenger pirates who became the galaxy's ultimate predators.",
    lore: "The Reapers aren't a species - they're a survival strategy that became a culture. Born from desperate refugees who seized abandoned military vessels and raided convoys to survive, they evolved into one of the most feared forces in known space. Their motto: 'The void gives to those who take.'",
    motto: "Kesh vek marr - Fortune favors the bold.",
    bonuses: { economy: 1.1, combat: 1.2, research: 1.0 },
    ships: {
      drone: [
        { id: 'reapers_drone_fodder', name: "Drone Fodder", attack: 0, defense: 1, cost: { credits: 2, metal: 2 }, buildTime: 1, tier: 0 }
      ],
      frigate: [
        { id: 'reapers_diy_dart', name: "DIY Dart", attack: 5, defense: 2, cost: { credits: 12, metal: 14 }, buildTime: 2, tier: 1 },
        { id: 'reapers_duct_taped_zero', name: "Duct Taped Zero", attack: 7, defense: 3, cost: { credits: 15, metal: 17 }, buildTime: 2, tier: 2 }
      ],
      cruiser: [
        { id: 'reapers_reinforced_rusty', name: "Reinforced Rusty Cruiser", attack: 18, defense: 20, cost: { credits: 250, metal: 45 }, buildTime: 4, tier: 3 },
        { id: 'reapers_papst', name: "Papst", attack: 22, defense: 25, cost: { credits: 300, metal: 55 }, buildTime: 4, tier: 4 }
      ],
      battleship: [
        { id: 'reapers_winnebago', name: "Winnebago", attack: 90, defense: 85, cost: { credits: 38000, metal: 1150 }, buildTime: 8, tier: 5 }
      ],
      capitol: [
        { id: 'reapers_confederacy', name: "Confederacy", attack: 230, defense: 225, cost: { credits: 100500, metal: 10000 }, buildTime: 15, tier: 6 }
      ]
    }
  },
  ascendancy: {
    name: "The Ascendancy",
    color: "#fbbf24",
    secondaryColor: "#f59e0b",
    description: "Religious zealots seeking transcendence through Ancient technology.",
    lore: "The Ascendancy began when archaeologists discovered an Ancient archive on Zenith-7. They emerged as prophets carrying a message: the Ancient Ones would return when the galaxy achieved spiritual unity. Those who achieved enlightenment would transcend; those who resisted would be swept aside.",
    motto: "Unity through Convergence. Transcendence through Faith.",
    bonuses: { economy: 1.0, combat: 1.1, research: 1.3 },
    ships: {
      drone: [
        { id: 'ascendancy_drone_fodder', name: "Drone Fodder", attack: 0, defense: 1, cost: { credits: 2, metal: 2 }, buildTime: 1, tier: 0 }
      ],
      frigate: [
        { id: 'ascendancy_light', name: "Light", attack: 4, defense: 4, cost: { credits: 14, metal: 6 }, buildTime: 2, tier: 1 },
        { id: 'ascendancy_acolyte', name: "Acolyte", attack: 5, defense: 5, cost: { credits: 18, metal: 8 }, buildTime: 2, tier: 2 }
      ],
      cruiser: [
        { id: 'ascendancy_vision', name: "Vision", attack: 20, defense: 20, cost: { credits: 160, metal: 28 }, buildTime: 4, tier: 3 },
        { id: 'ascendancy_divine', name: "Divine", attack: 22, defense: 22, cost: { credits: 180, metal: 32 }, buildTime: 4, tier: 4 },
        { id: 'ascendancy_truth', name: "Truth", attack: 25, defense: 25, cost: { credits: 200, metal: 35 }, buildTime: 4, tier: 5 }
      ],
      battleship: [
        { id: 'ascendancy_tempest', name: "Tempest", attack: 100, defense: 100, cost: { credits: 40000, metal: 800 }, buildTime: 8, tier: 6 },
        { id: 'ascendancy_transcendence', name: "Transcendence", attack: 120, defense: 115, cost: { credits: 45000, metal: 875 }, buildTime: 8, tier: 7 },
        { id: 'ascendancy_rebirth', name: "Rebirth", attack: 135, defense: 130, cost: { credits: 50000, metal: 950 }, buildTime: 8, tier: 8 }
      ],
      capitol: [
        { id: 'ascendancy_holy_endeavour', name: "Holy Endeavour", attack: 225, defense: 250, cost: { credits: 95000, metal: 9000 }, buildTime: 15, tier: 9 }
      ]
    }
  }
};

// --- RESEARCH TREE (generated per faction, but uses generic progression) ---
// Ships with tier 0 are always available, tier 1+ require research
export function getResearchProjectsForFaction(factionKey: FactionKey): ResearchProject[] {
  const faction = FACTIONS[factionKey];
  const projects: ResearchProject[] = [];
  const categories: ShipCategory[] = ['frigate', 'cruiser', 'battleship', 'capitol'];
  
  let prevProjectId: string | null = null;
  let projectIndex = 0;
  
  for (const category of categories) {
    const ships = faction.ships[category];
    for (const ship of ships) {
      if (ship.tier === 0) continue; // Tier 0 ships are always unlocked
      
      const project: ResearchProject = {
        id: `research_${ship.id}`,
        name: ship.name,
        description: `Unlock the ${ship.name} ${category}`,
        shipUnlockId: ship.id,
        category,
        cost: { 
          credits: Math.floor(ship.cost.credits * 0.5), 
          he3: Math.floor(ship.cost.metal * 0.3)  // HE3 fuel for research
        },
        researchTime: 20 + projectIndex * 15,
        requiredLab: Math.min(3, Math.floor(projectIndex / 3) + 1),
        prerequisites: prevProjectId ? [prevProjectId] : []
      };
      
      projects.push(project);
      prevProjectId = project.id;
      projectIndex++;
    }
  }
  
  return projects;
}

// --- GALAXY CONFIGURATION ---
const GALAXY_WIDTH = 4000;
const GALAXY_HEIGHT = 3000;
const TOTAL_PLANETS = 150;

export function useGameEngine() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [gameTime, setGameTime] = useState(0);
  const [player, setPlayer] = useState<Player | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [galaxy, setGalaxy] = useState<Planet[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [combatLog, setCombatLog] = useState<CombatEvent[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [research, setResearch] = useState<ResearchState>({ completed: [], current: null, progress: 0 });
  const [showResearchPanel, setShowResearchPanel] = useState(false);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    setNotifications(prev => [{ id: Date.now() + Math.random(), message, type }, ...prev].slice(0, 8));
  }, []);

  const addCombatEvent = useCallback((event: Omit<CombatEvent, 'id'>) => {
    setCombatLog(prev => [{ ...event, id: Date.now() + Math.random() }, ...prev].slice(0, 30));
  }, []);

  const generateGalaxy = useCallback((playerFaction: FactionKey): Planet[] => {
    const planets: Planet[] = [];
    const types: Planet['type'][] = ['balanced', 'desert', 'water', 'ice', 'forest', 'barren', 'gas'];
    const sizes: Planet['size'][] = ['small', 'medium', 'large'];
    
    const minDist = 120;
    const positions: { x: number; y: number }[] = [];

    const getValidPosition = (): { x: number; y: number } => {
      for (let attempts = 0; attempts < 100; attempts++) {
        const x = 100 + Math.random() * (GALAXY_WIDTH - 200);
        const y = 100 + Math.random() * (GALAXY_HEIGHT - 200);
        
        let valid = true;
        for (const pos of positions) {
          const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
          if (dist < minDist) {
            valid = false;
            break;
          }
        }
        if (valid) {
          positions.push({ x, y });
          return { x, y };
        }
      }
      const x = 100 + Math.random() * (GALAXY_WIDTH - 200);
      const y = 100 + Math.random() * (GALAXY_HEIGHT - 200);
      positions.push({ x, y });
      return { x, y };
    };

    // Player homeworld
    const playerHome: Planet = {
      id: 'player_home',
      name: playerFaction === 'tarren' ? 'New Tarra' : 
            playerFaction === 'korai' ? 'Kora Prime' :
            playerFaction === 'reapers' ? 'Blackwater Station' : 'Zenith Prime',
      owner: 'player',
      x: 300,
      y: GALAXY_HEIGHT / 2,
      size: 'large',
      type: 'balanced',
      baseIncome: 50,
      defense: 100,
      population: 1000,
      maxPopulation: 5000,
      structures: { shipyard: 2, defenseGrid: 2, miningFacility: 2, researchLab: 1 }
    };
    planets.push(playerHome);
    positions.push({ x: playerHome.x, y: playerHome.y });

    // AI homeworkds (one for each other faction)
    const aiFactions = (Object.keys(FACTIONS) as FactionKey[]).filter(f => f !== playerFaction);
    const aiHomePositions = [
      { x: GALAXY_WIDTH - 300, y: 400 },
      { x: GALAXY_WIDTH - 300, y: GALAXY_HEIGHT - 400 },
      { x: GALAXY_WIDTH / 2, y: 200 }
    ];

    aiFactions.forEach((faction, i) => {
      const pos = aiHomePositions[i];
      positions.push(pos);
      planets.push({
        id: `ai_${i}_home`,
        name: faction === 'tarren' ? 'New Tarra' : 
              faction === 'korai' ? 'Kora Prime' :
              faction === 'reapers' ? 'Blackwater Station' : 'Zenith Prime',
        owner: `ai_${i}`,
        x: pos.x,
        y: pos.y,
        size: 'large',
        type: 'balanced',
        baseIncome: 50,
        defense: 100,
        population: 1000,
        maxPopulation: 5000,
        structures: { shipyard: 2, defenseGrid: 2, miningFacility: 2, researchLab: 1 }
      });
    });

    // Generate neutral planets
    for (let i = 0; i < TOTAL_PLANETS - 4; i++) {
      const pos = getValidPosition();
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const incomeBySize = { small: 10, medium: 20, large: 35 };
      const popBySize = { small: 500, medium: 1500, large: 3000 };
      // Apply population modifier from planet type (-100% = uninhabitable)
      const popMod = 1 + PLANET_MODIFIERS[type].population / 100;
      const maxPop = Math.max(0, Math.floor(popBySize[size] * popMod));
      
      planets.push({
        id: `planet_${i}`,
        name: generatePlanetName(i),
        owner: null,
        x: pos.x,
        y: pos.y,
        size,
        type,
        baseIncome: incomeBySize[size] + Math.floor(Math.random() * 10),
        defense: 10 + Math.floor(Math.random() * 30),
        population: 0,
        maxPopulation: maxPop,
        structures: { shipyard: 0, defenseGrid: 0, miningFacility: 0, researchLab: 0 }
      });
    }

    return planets;
  }, []);

  const startGame = useCallback((factionKey: FactionKey) => {
    const newGalaxy = generateGalaxy(factionKey);
    setGalaxy(newGalaxy);

    // Create player
    setPlayer({
      faction: factionKey,
      resources: { credits: 2000, metal: 1000, he3: 500, food: 500 },
      fleets: [],
      homeworld: 'player_home',
      score: 0
    });

    // Create AI players
    const aiFactions = (Object.keys(FACTIONS) as FactionKey[]).filter(f => f !== factionKey);
    const personalities: AIPlayer['personality'][] = ['aggressive', 'defensive', 'economic'];
    
    setAiPlayers(aiFactions.map((faction, i) => ({
      id: `ai_${i}`,
      faction,
      name: FACTIONS[faction].name,
      resources: { credits: 2000, metal: 1000, he3: 500, food: 500 },
      fleets: [],
      homeworld: `ai_${i}_home`,
      score: 0,
      difficulty: 'normal',
      personality: personalities[i % personalities.length]
    })));

    // Create initial fleets at homeworkds
    const playerHomeworld = newGalaxy.find(p => p.id === 'player_home')!;
    setFleets([
      {
        id: 'player_fleet_0',
        x: playerHomeworld.x,
        y: playerHomeworld.y,
        ships: { drone: 5, frigate: 2 },
        moving: false,
        destination: null,
        owner: 'player'
      },
      ...aiFactions.map((faction, i) => {
        const aiHome = newGalaxy.find(p => p.id === `ai_${i}_home`)!;
        return {
          id: `ai_${i}_fleet_0`,
          x: aiHome.x,
          y: aiHome.y,
          ships: { drone: 5, frigate: 2 },
          moving: false,
          destination: null,
          owner: `ai_${i}`
        };
      })
    ]);

    setGameState('playing');
    setGameTime(0);
    setNotifications([]);
    setCombatLog([]);
    addNotification("Command initialized. Secure the galaxy, Commander.", "info");
  }, [generateGalaxy, addNotification]);

  // Resource collection
  const collectResources = useCallback(() => {
    if (!player) return;

    const playerPlanets = galaxy.filter(p => p.owner === 'player');
    let creditIncome = 0;
    let mineralIncome = 0;
    let he3Income = 0;
    let foodIncome = 0;
    let totalPopulation = 0;

    playerPlanets.forEach(planet => {
      const efficiency = FACTIONS[player.faction].bonuses.economy;
      const mods = PLANET_MODIFIERS[planet.type];
      // Apply planet type modifiers (percentage bonuses)
      const metalMod = 1 + mods.metal / 100;
      const he3Mod = 1 + mods.he3 / 100;
      const foodMod = 1 + mods.food / 100;
      // Base resources with modifiers
      foodIncome += Math.max(0, Math.floor(10 * foodMod * efficiency));
      he3Income += Math.max(0, Math.floor(10 * he3Mod * efficiency));
      mineralIncome += Math.max(0, Math.floor((planet.structures.miningFacility * 15 + 5) * metalMod * efficiency));
      // Credits scale with population
      totalPopulation += planet.population;
      creditIncome += Math.floor((planet.baseIncome + planet.population * 0.5) * efficiency);
    });

    // Food maintains population: need 1 food per 10 population
    const foodRequired = Math.floor(totalPopulation / 10);
    const netFood = foodIncome - foodRequired;

    setPlayer(prev => prev ? {
      ...prev,
      resources: {
        credits: prev.resources.credits + creditIncome,
        metal: prev.resources.metal + mineralIncome,
        he3: prev.resources.he3 + he3Income,
        food: Math.max(0, prev.resources.food + netFood)
      }
    } : null);

    // Grow population on player planets if we have surplus food
    if (netFood > 0) {
      setGalaxy(prev => prev.map(planet => {
        if (planet.owner === 'player' && planet.population < planet.maxPopulation) {
          const growthRate = Math.min(2, planet.maxPopulation - planet.population);
          return { ...planet, population: planet.population + growthRate };
        }
        return planet;
      }));
    } else if (netFood < -10) {
      // Population declines if severe food shortage
      setGalaxy(prev => prev.map(planet => {
        if (planet.owner === 'player' && planet.population > 1) {
          return { ...planet, population: Math.max(1, planet.population - 1) };
        }
        return planet;
      }));
    }

    // AI resource collection
    setAiPlayers(prev => prev.map(ai => {
      const aiPlanets = galaxy.filter(p => p.owner === ai.id);
      let aiCredits = 0;
      let aiMinerals = 0;
      let aiEnergy = 0;
      let aiFood = 0;
      let aiPopulation = 0;

      aiPlanets.forEach(planet => {
        const efficiency = FACTIONS[ai.faction].bonuses.economy;
        const mods = PLANET_MODIFIERS[planet.type];
        const metalMod = 1 + mods.metal / 100;
        const he3Mod = 1 + mods.he3 / 100;
        const foodMod = 1 + mods.food / 100;
        aiFood += Math.max(0, Math.floor(10 * foodMod * efficiency));
        aiPopulation += planet.population;
        aiCredits += Math.floor((planet.baseIncome + planet.population * 0.5) * efficiency);
        aiMinerals += Math.max(0, Math.floor((planet.structures.miningFacility * 15 + 5) * metalMod * efficiency));
        aiEnergy += Math.max(0, Math.floor(10 * he3Mod * efficiency));
      });

      const aiFoodRequired = Math.floor(aiPopulation / 10);
      const aiNetFood = aiFood - aiFoodRequired;

      return {
        ...ai,
        resources: {
          credits: ai.resources.credits + aiCredits,
          metal: ai.resources.metal + aiMinerals,
          he3: ai.resources.he3 + aiEnergy,
          food: Math.max(0, ai.resources.food + aiNetFood)
        }
      };
    }));

  }, [player, galaxy]);

  // Handle AI population growth based on food (called after AI resources updated)
  const updateAiPopulation = useCallback(() => {
    setAiPlayers(prevAi => {
      // Calculate net food for each AI
      const aiFoodStatus = prevAi.map(ai => {
        const aiPlanets = galaxy.filter(p => p.owner === ai.id);
        let foodIncome = 0;
        let totalPop = 0;
        aiPlanets.forEach(planet => {
          const efficiency = FACTIONS[ai.faction].bonuses.economy;
          const mods = PLANET_MODIFIERS[planet.type];
          const foodMod = 1 + mods.food / 100;
          foodIncome += Math.max(0, Math.floor(10 * foodMod * efficiency));
          totalPop += planet.population;
        });
        const required = Math.floor(totalPop / 10);
        return { id: ai.id, netFood: foodIncome - required };
      });

      // Grow or shrink AI planet populations based on food
      setGalaxy(prev => prev.map(planet => {
        if (!planet.owner || !planet.owner.startsWith('ai_')) return planet;
        const status = aiFoodStatus.find(s => s.id === planet.owner);
        if (!status) return planet;

        if (status.netFood > 0 && planet.population < planet.maxPopulation) {
          return { ...planet, population: Math.min(planet.maxPopulation, planet.population + 1) };
        } else if (status.netFood < -10 && planet.population > 1) {
          return { ...planet, population: planet.population - 1 };
        }
        return planet;
      }));

      return prevAi;
    });
  }, [galaxy]);

  // Calculate fleet combat stats
  const calculateFleetStats = useCallback((fleet: Fleet, ownerFaction: FactionKey): { attack: number; defense: number } => {
    let totalAttack = 0;
    let totalDefense = 0;
    const faction = FACTIONS[ownerFaction];
    
    Object.entries(fleet.ships).forEach(([shipId, count]) => {
      if (!count) return;
      // Find ship in faction data
      for (const category of Object.keys(faction.ships) as ShipCategory[]) {
        const ship = faction.ships[category].find(s => s.id === shipId);
        if (ship) {
          totalAttack += ship.attack * count;
          totalDefense += ship.defense * count;
          break;
        }
      }
    });
    
    // Apply combat bonus
    totalAttack = Math.floor(totalAttack * faction.bonuses.combat);
    totalDefense = Math.floor(totalDefense * faction.bonuses.combat);
    
    return { attack: totalAttack, defense: totalDefense };
  }, []);

  // Get faction for an owner
  const getOwnerFaction = useCallback((owner: string): FactionKey | null => {
    if (owner === 'player' && player) return player.faction;
    const ai = aiPlayers.find(a => a.id === owner);
    return ai ? ai.faction : null;
  }, [player, aiPlayers]);

  // Combat between two fleets
  const resolveCombat = useCallback((
    attackerFleet: Fleet, 
    defenderFleet: Fleet,
    location: string
  ): { winner: 'attacker' | 'defender' | 'draw'; attackerLosses: Record<string, number>; defenderLosses: Record<string, number> } => {
    if (!attackerFleet.owner || !defenderFleet.owner) {
      return { winner: 'draw', attackerLosses: {}, defenderLosses: {} };
    }
    const attackerFaction = getOwnerFaction(attackerFleet.owner);
    const defenderFaction = getOwnerFaction(defenderFleet.owner);
    
    if (!attackerFaction || !defenderFaction) {
      return { winner: 'draw', attackerLosses: {}, defenderLosses: {} };
    }
    
    const attackerStats = calculateFleetStats(attackerFleet, attackerFaction);
    const defenderStats = calculateFleetStats(defenderFleet, defenderFaction);
    
    // Combat calculation with randomness
    const attackerPower = Math.max(1, attackerStats.attack + Math.random() * attackerStats.attack * 0.3);
    const defenderPower = Math.max(1, defenderStats.defense + Math.random() * defenderStats.defense * 0.3);
    
    const attackerLosses: Record<string, number> = {};
    const defenderLosses: Record<string, number> = {};
    
    // Calculate losses based on power difference - clamp ratios to prevent extreme values
    const powerRatio = Math.max(0.1, Math.min(10, attackerPower / defenderPower));
    const defenderDamageRatio = Math.min(0.9, Math.max(0.05, powerRatio * 0.4));
    const attackerDamageRatio = Math.min(0.9, Math.max(0.05, (1 / powerRatio) * 0.3));
    
    // Apply losses to defender
    Object.entries(defenderFleet.ships).forEach(([shipId, count]) => {
      if (count) {
        const lost = Math.floor(count * defenderDamageRatio);
        if (lost > 0) defenderLosses[shipId] = lost;
      }
    });
    
    // Apply losses to attacker
    Object.entries(attackerFleet.ships).forEach(([shipId, count]) => {
      if (count) {
        const lost = Math.floor(count * attackerDamageRatio);
        if (lost > 0) attackerLosses[shipId] = lost;
      }
    });
    
    // Determine winner
    let winner: 'attacker' | 'defender' | 'draw';
    if (attackerPower > defenderPower * 1.2) {
      winner = 'attacker';
    } else if (defenderPower > attackerPower * 1.2) {
      winner = 'defender';
    } else {
      winner = 'draw';
    }
    
    return { winner, attackerLosses, defenderLosses };
  }, [calculateFleetStats, getOwnerFaction]);

  // Attack enemy planet
  const attackPlanet = useCallback((attackerFleet: Fleet, targetPlanet: Planet) => {
    if (!player) return;
    if (attackerFleet.owner !== 'player') return;
    if (targetPlanet.owner === 'player' || targetPlanet.owner === null) return;
    
    const attackerFaction = player.faction;
    const defenderFaction = getOwnerFaction(targetPlanet.owner);
    
    if (!defenderFaction) return;
    
    const attackerStats = calculateFleetStats(attackerFleet, attackerFaction);
    
    // Planet defense from structures
    const planetDefense = targetPlanet.structures.defenseGrid * 50 + 20;
    
    // Find defending fleet at planet
    const defenderFleet = fleets.find(f => 
      f.owner === targetPlanet.owner && 
      !f.moving && 
      Math.abs(f.x - targetPlanet.x) < 50 && 
      Math.abs(f.y - targetPlanet.y) < 50
    );
    
    let totalDefense = planetDefense;
    let defenderStats = { attack: 0, defense: planetDefense };
    
    if (defenderFleet) {
      defenderStats = calculateFleetStats(defenderFleet, defenderFaction);
      totalDefense += defenderStats.defense;
    }
    
    // Combat - clamp minimum power values to prevent division issues
    const attackerPower = Math.max(1, attackerStats.attack + Math.random() * attackerStats.attack * 0.3);
    const defenderPower = Math.max(1, totalDefense + Math.random() * totalDefense * 0.3);
    
    const attackerLosses: Record<string, number> = {};
    const defenderLosses: Record<string, number> = {};
    
    // Calculate losses - clamp ratios to prevent extreme values
    const powerRatio = Math.max(0.1, Math.min(10, attackerPower / defenderPower));
    const attackerDamageRatio = Math.min(0.8, Math.max(0.05, (1 / powerRatio) * 0.35));
    
    // Apply losses to attacker
    Object.entries(attackerFleet.ships).forEach(([shipId, count]) => {
      if (count) {
        const lost = Math.ceil(count * attackerDamageRatio);
        if (lost > 0) attackerLosses[shipId] = lost;
      }
    });
    
    // Apply losses to defender fleet
    if (defenderFleet) {
      const defenderDamageRatio = Math.min(0.9, powerRatio * 0.5);
      Object.entries(defenderFleet.ships).forEach(([shipId, count]) => {
        if (count) {
          const lost = Math.floor(count * defenderDamageRatio);
          if (lost > 0) defenderLosses[shipId] = lost;
        }
      });
    }
    
    const attackerWins = attackerPower > defenderPower * 1.1;
    const winnerName = attackerWins ? 'Player' : (aiPlayers.find(a => a.id === targetPlanet.owner)?.faction || 'Defender');
    
    // Log combat event
    addCombatEvent({
      timestamp: gameTime,
      location: targetPlanet.name,
      attacker: 'Player',
      defender: aiPlayers.find(a => a.id === targetPlanet.owner)?.faction || 'Unknown',
      attackerLosses,
      defenderLosses,
      winner: winnerName
    });
    
    // Update fleets with losses
    setFleets(prev => prev.map(f => {
      if (f.id === attackerFleet.id) {
        const newShips = { ...f.ships };
        Object.entries(attackerLosses).forEach(([shipId, lost]) => {
          newShips[shipId] = Math.max(0, (newShips[shipId] || 0) - lost);
          if (newShips[shipId] === 0) delete newShips[shipId];
        });
        return { ...f, ships: newShips };
      }
      if (defenderFleet && f.id === defenderFleet.id) {
        const newShips = { ...f.ships };
        Object.entries(defenderLosses).forEach(([shipId, lost]) => {
          newShips[shipId] = Math.max(0, (newShips[shipId] || 0) - lost);
          if (newShips[shipId] === 0) delete newShips[shipId];
        });
        return { ...f, ships: newShips };
      }
      return f;
    }).filter(f => Object.values(f.ships).some(c => c && c > 0)));
    
    // If attacker wins, capture planet
    if (attackerWins) {
      const previousOwner = targetPlanet.owner;
      
      setGalaxy(prev => {
        const updated = prev.map(p => 
          p.id === targetPlanet.id ? { ...p, owner: 'player' as const, population: Math.floor(p.population * 0.5) } : p
        );
        
        // Check elimination with the latest state
        if (previousOwner && previousOwner !== 'player') {
          const remainingPlanets = updated.filter(p => p.owner === previousOwner);
          if (remainingPlanets.length === 0) {
            const eliminatedAi = aiPlayers.find(a => a.id === previousOwner);
            if (eliminatedAi) {
              setTimeout(() => {
                addNotification(`${FACTIONS[eliminatedAi.faction].name} has been eliminated!`, 'success');
                setAiPlayers(p => p.filter(ai => ai.id !== previousOwner));
                setFleets(f => f.filter(fl => fl.owner !== previousOwner));
              }, 0);
            }
          }
        }
        
        return updated;
      });
      addNotification(`Victory! ${targetPlanet.name} captured!`, 'success');
    } else {
      addNotification(`Attack on ${targetPlanet.name} repelled!`, 'error');
    }
  }, [player, fleets, aiPlayers, gameTime, calculateFleetStats, getOwnerFaction, addCombatEvent, addNotification]);

  // Attack enemy fleet
  const attackFleet = useCallback((attackerFleet: Fleet, defenderFleet: Fleet) => {
    if (!player) return;
    if (attackerFleet.owner !== 'player') return;
    if (defenderFleet.owner === 'player') return;
    
    const planet = galaxy.find(p => 
      Math.abs(p.x - defenderFleet.x) < 50 && Math.abs(p.y - defenderFleet.y) < 50
    );
    const location = planet?.name || 'Deep Space';
    
    const result = resolveCombat(attackerFleet, defenderFleet, location);
    
    const attackerFactionName = 'Player';
    const defenderAi = aiPlayers.find(a => a.id === defenderFleet.owner);
    const defenderFactionName = defenderAi?.faction || 'Unknown';
    
    // Log combat event
    addCombatEvent({
      timestamp: gameTime,
      location,
      attacker: attackerFactionName,
      defender: defenderFactionName,
      attackerLosses: result.attackerLosses,
      defenderLosses: result.defenderLosses,
      winner: result.winner === 'attacker' ? attackerFactionName : 
              result.winner === 'defender' ? defenderFactionName : 'Draw'
    });
    
    // Update fleets with losses
    setFleets(prev => prev.map(f => {
      if (f.id === attackerFleet.id) {
        const newShips = { ...f.ships };
        Object.entries(result.attackerLosses).forEach(([shipId, lost]) => {
          newShips[shipId] = Math.max(0, (newShips[shipId] || 0) - lost);
          if (newShips[shipId] === 0) delete newShips[shipId];
        });
        return { ...f, ships: newShips };
      }
      if (f.id === defenderFleet.id) {
        const newShips = { ...f.ships };
        Object.entries(result.defenderLosses).forEach(([shipId, lost]) => {
          newShips[shipId] = Math.max(0, (newShips[shipId] || 0) - lost);
          if (newShips[shipId] === 0) delete newShips[shipId];
        });
        return { ...f, ships: newShips };
      }
      return f;
    }).filter(f => Object.values(f.ships).some(c => c && c > 0)));
    
    if (result.winner === 'attacker') {
      addNotification(`Fleet engagement won in ${location}!`, 'success');
    } else if (result.winner === 'defender') {
      addNotification(`Fleet engagement lost in ${location}!`, 'error');
    } else {
      addNotification(`Fleet engagement in ${location} was inconclusive.`, 'warning');
    }
  }, [player, galaxy, aiPlayers, gameTime, resolveCombat, addCombatEvent, addNotification]);

  // Process AI combat when AI fleet arrives at enemy planet
  const processAICombat = useCallback((attackerFleet: Fleet, targetPlanet: Planet) => {
    const attackerAi = aiPlayers.find(a => a.id === attackerFleet.owner);
    const attackerFaction = attackerAi?.faction || 'tarren';
    const attackerStats = calculateFleetStats(attackerFleet, attackerFaction);
    
    // Get defender info
    const defenderFactionResult = targetPlanet.owner ? getOwnerFaction(targetPlanet.owner) : null;
    const defenderFaction: FactionKey = defenderFactionResult || 'tarren';
    const defenderFleet = fleets.find(f => f.owner === targetPlanet.owner && !f.moving && 
      Math.abs(f.x - targetPlanet.x) < 50 && Math.abs(f.y - targetPlanet.y) < 50);
    
    const defenderStats = defenderFleet ? calculateFleetStats(defenderFleet, defenderFaction) : { attack: 0, defense: 0 };
    const planetDefense = targetPlanet.defense + targetPlanet.structures.defenseGrid * 25;
    const totalDefense = defenderStats.defense + planetDefense;
    
    const attackerPower = Math.max(1, attackerStats.attack + Math.random() * attackerStats.attack * 0.3);
    const defenderPower = Math.max(1, totalDefense + Math.random() * totalDefense * 0.3);
    
    const attackerWins = attackerPower > defenderPower * 1.1;
    
    // Apply losses
    const powerRatio = attackerPower / Math.max(1, defenderPower);
    const attackerDamageRatio = Math.min(0.9, (1 / powerRatio) * 0.5);
    
    // Update attacker fleet
    setFleets(prev => prev.map(f => {
      if (f.id === attackerFleet.id) {
        const newShips = { ...f.ships };
        Object.entries(f.ships).forEach(([shipId, count]) => {
          if (count) {
            const lost = Math.floor(count * attackerDamageRatio);
            if (lost > 0) {
              newShips[shipId] = Math.max(0, count - lost);
              if (newShips[shipId] === 0) delete newShips[shipId];
            }
          }
        });
        return { ...f, ships: newShips };
      }
      if (defenderFleet && f.id === defenderFleet.id) {
        const defenderDamageRatio = Math.min(0.9, powerRatio * 0.5);
        const newShips = { ...f.ships };
        Object.entries(f.ships).forEach(([shipId, count]) => {
          if (count) {
            const lost = Math.floor(count * defenderDamageRatio);
            if (lost > 0) {
              newShips[shipId] = Math.max(0, count - lost);
              if (newShips[shipId] === 0) delete newShips[shipId];
            }
          }
        });
        return { ...f, ships: newShips };
      }
      return f;
    }).filter(f => Object.values(f.ships).some(c => c && c > 0)));
    
    if (attackerWins) {
      const previousOwner = targetPlanet.owner;
      const attackerName = attackerAi ? FACTIONS[attackerAi.faction].name : 'Unknown';
      
      // Capture planet and check elimination in the same updater
      setGalaxy(prev => {
        const updated = prev.map(p => 
          p.id === targetPlanet.id ? { ...p, owner: attackerFleet.owner, population: Math.floor(p.population * 0.5) } : p
        );
        
        // Check elimination with the latest state
        if (previousOwner && previousOwner !== 'player') {
          const remainingPlanets = updated.filter(p => p.owner === previousOwner);
          if (remainingPlanets.length === 0) {
            const eliminatedAi = aiPlayers.find(a => a.id === previousOwner);
            if (eliminatedAi) {
              setTimeout(() => {
                addNotification(`${FACTIONS[eliminatedAi.faction].name} has been eliminated!`, 'success');
                setAiPlayers(p => p.filter(ai => ai.id !== previousOwner));
                setFleets(f => f.filter(fl => fl.owner !== previousOwner));
              }, 0);
            }
          }
        }
        
        return updated;
      });
      
      if (previousOwner === 'player') {
        addNotification(`${attackerName} captured ${targetPlanet.name}!`, 'error');
      }
    }
  }, [aiPlayers, fleets, calculateFleetStats, getOwnerFaction, addNotification]);

  // Fleet movement with AI combat resolution
  const moveFleets = useCallback(() => {
    const SPEED = 40;
    const combatEvents: Array<{fleet: Fleet, planet: Planet}> = [];

    setFleets(prev => {
      const updated: Fleet[] = [];
      
      prev.forEach(fleet => {
        if (!fleet.moving || !fleet.destination) {
          updated.push(fleet);
          return;
        }

        const dx = fleet.destination.x - fleet.x;
        const dy = fleet.destination.y - fleet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SPEED) {
          // Arrived
          const arrivedFleet = { ...fleet, x: fleet.destination.x, y: fleet.destination.y, moving: false, destination: null };
          updated.push(arrivedFleet);
          
          const targetPlanet = galaxy.find(p => p.id === fleet.destination?.id);
          
          if (fleet.owner === 'player') {
            addNotification(`Fleet arrived at ${targetPlanet?.name || 'destination'}`, 'info');
          } else if (targetPlanet && targetPlanet.owner !== null && targetPlanet.owner !== fleet.owner) {
            // AI fleet arrived at enemy planet - queue combat
            combatEvents.push({ fleet: arrivedFleet, planet: targetPlanet });
          }
        } else {
          updated.push({
            ...fleet,
            x: fleet.x + (dx / dist) * SPEED,
            y: fleet.y + (dy / dist) * SPEED
          });
        }
      });

      return updated;
    });

    // Process AI combat events
    combatEvents.forEach(({ fleet, planet }) => {
      processAICombat(fleet, planet);
    });
  }, [galaxy, addNotification, processAICombat]);

  // Check for eliminated factions
  const checkFactionElimination = useCallback(() => {
    const eliminatedAIs: string[] = [];
    
    aiPlayers.forEach(ai => {
      const aiPlanets = galaxy.filter(p => p.owner === ai.id);
      if (aiPlanets.length === 0) {
        eliminatedAIs.push(ai.id);
        addNotification(`${FACTIONS[ai.faction].name} has been eliminated!`, 'success');
      }
    });
    
    if (eliminatedAIs.length > 0) {
      setAiPlayers(prev => prev.filter(ai => !eliminatedAIs.includes(ai.id)));
      // Remove their fleets too
      setFleets(prev => prev.filter(f => !eliminatedAIs.includes(f.owner as string)));
    }
  }, [aiPlayers, galaxy, addNotification]);

  // Send fleet to destination
  const sendFleet = useCallback((fleet: Fleet, destination: Planet) => {
    setFleets(prev => prev.map(f => 
      f.id === fleet.id 
        ? { ...f, moving: true, destination }
        : f
    ));
    setSelectedFleet(null);
    addNotification(`Fleet dispatched to ${destination.name}`, 'info');
  }, [addNotification]);

  // Build ship by ID
  const buildShip = useCallback((planetId: string, shipId: string) => {
    if (!player) return;

    const planet = galaxy.find(p => p.id === planetId);
    if (!planet || planet.owner !== 'player') return;
    if (planet.structures.shipyard < 1) {
      addNotification("Shipyard required to build ships!", "error");
      return;
    }

    // Find the ship in faction data
    const faction = FACTIONS[player.faction];
    let ship: ShipType | null = null;
    for (const category of Object.keys(faction.ships) as ShipCategory[]) {
      const found = faction.ships[category].find(s => s.id === shipId);
      if (found) {
        ship = found;
        break;
      }
    }
    
    if (!ship) {
      addNotification("Ship not found!", "error");
      return;
    }

    if (player.resources.credits < ship.cost.credits || player.resources.metal < ship.cost.metal) {
      addNotification("Insufficient resources!", "error");
      return;
    }

    setPlayer(prev => prev ? {
      ...prev,
      resources: {
        ...prev.resources,
        credits: prev.resources.credits - ship!.cost.credits,
        metal: prev.resources.metal - ship!.cost.metal
      }
    } : null);

    // Add ship to fleet at planet or create new fleet
    setFleets(prev => {
      const existingFleet = prev.find(f => f.owner === 'player' && !f.moving && 
        Math.abs(f.x - planet.x) < 50 && Math.abs(f.y - planet.y) < 50);
      
      if (existingFleet) {
        return prev.map(f => f.id === existingFleet.id ? {
          ...f,
          ships: { ...f.ships, [shipId]: (f.ships[shipId] || 0) + 1 }
        } : f);
      } else {
        return [...prev, {
          id: `player_fleet_${Date.now()}`,
          x: planet.x,
          y: planet.y,
          ships: { [shipId]: 1 },
          moving: false,
          destination: null,
          owner: 'player'
        }];
      }
    });

    addNotification(`${ship.name} constructed at ${planet.name}`, 'success');
  }, [player, galaxy, addNotification]);

  // Upgrade structure
  const upgradeStructure = useCallback((planetId: string, structure: keyof Planet['structures']) => {
    if (!player) return;

    const costs = {
      shipyard: { credits: 500, metal: 300 },
      defenseGrid: { credits: 400, metal: 200 },
      miningFacility: { credits: 300, metal: 400 },
      researchLab: { credits: 600, metal: 200 }
    };

    const cost = costs[structure];
    if (player.resources.credits < cost.credits || player.resources.metal < cost.metal) {
      addNotification("Insufficient resources for upgrade!", "error");
      return;
    }

    setPlayer(prev => prev ? {
      ...prev,
      resources: {
        ...prev.resources,
        credits: prev.resources.credits - cost.credits,
        metal: prev.resources.metal - cost.metal
      }
    } : null);

    setGalaxy(prev => prev.map(p => 
      p.id === planetId ? {
        ...p,
        structures: { ...p.structures, [structure]: p.structures[structure] + 1 }
      } : p
    ));

    addNotification(`${structure} upgraded!`, 'success');
  }, [player, addNotification]);

  // Colonize planet
  const colonizePlanet = useCallback((planetId: string, fleetId: string) => {
    const planet = galaxy.find(p => p.id === planetId);
    const fleet = fleets.find(f => f.id === fleetId);
    
    if (!planet || !fleet || planet.owner !== null) return;
    if (fleet.owner !== 'player') return;

    const totalShips = Object.values(fleet.ships).reduce((a, b) => a + (b || 0), 0);
    if (totalShips < 1) return;

    setGalaxy(prev => prev.map(p => 
      p.id === planetId ? { ...p, owner: 'player', population: 100 } : p
    ));

    addNotification(`${planet.name} colonized!`, 'success');
  }, [galaxy, fleets, addNotification]);

  // Start research
  const startResearch = useCallback((projectId: string) => {
    if (!player) return;
    
    const projects = getResearchProjectsForFaction(player.faction);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Check if already completed
    if (research.completed.includes(projectId)) {
      addNotification("Already researched!", "error");
      return;
    }
    
    // Check if already researching
    if (research.current) {
      addNotification("Already researching something!", "error");
      return;
    }
    
    // Check prerequisites
    if (!project.prerequisites.every(prereq => research.completed.includes(prereq))) {
      addNotification("Prerequisites not met!", "error");
      return;
    }
    
    // Check lab level
    const maxLabLevel = galaxy.filter(p => p.owner === 'player').reduce((max, p) => Math.max(max, p.structures.researchLab), 0);
    if (maxLabLevel < project.requiredLab) {
      addNotification(`Need Research Lab level ${project.requiredLab}!`, "error");
      return;
    }
    
    // Check resources (research uses credits + HE3)
    if (player.resources.credits < project.cost.credits || player.resources.he3 < project.cost.he3) {
      addNotification("Insufficient resources!", "error");
      return;
    }
    
    // Deduct resources and start research
    setPlayer(prev => prev ? {
      ...prev,
      resources: {
        ...prev.resources,
        credits: prev.resources.credits - project.cost.credits,
        he3: prev.resources.he3 - project.cost.he3
      }
    } : null);
    
    setResearch(prev => ({ ...prev, current: projectId, progress: 0 }));
    addNotification(`Started researching: ${project.name}`, 'info');
  }, [player, research, galaxy, addNotification]);

  // Progress research (called in game loop)
  const progressResearch = useCallback(() => {
    if (!research.current || !player) return;
    
    const projects = getResearchProjectsForFaction(player.faction);
    const project = projects.find(p => p.id === research.current);
    if (!project) return;
    
    // Research speed based on lab levels
    const labBoost = galaxy.filter(p => p.owner === 'player').reduce((total, p) => total + p.structures.researchLab, 0);
    const speedMultiplier = FACTIONS[player.faction].bonuses.research;
    const progressAmount = (1 + labBoost * 0.2) * speedMultiplier;
    
    const newProgress = research.progress + progressAmount;
    
    if (newProgress >= project.researchTime) {
      // Research complete
      setResearch(prev => ({
        completed: [...prev.completed, project.id],
        current: null,
        progress: 0
      }));
      addNotification(`Research complete: ${project.name}! New ship unlocked.`, 'success');
    } else {
      setResearch(prev => ({ ...prev, progress: newProgress }));
    }
  }, [research, galaxy, player, addNotification]);

  // Check if ship is unlocked by ship ID
  const isShipUnlocked = useCallback((shipId: string): boolean => {
    if (!player) return false;
    
    // Find the ship in faction data
    const faction = FACTIONS[player.faction];
    let ship: ShipType | null = null;
    for (const category of Object.keys(faction.ships) as ShipCategory[]) {
      const found = faction.ships[category].find(s => s.id === shipId);
      if (found) {
        ship = found;
        break;
      }
    }
    
    if (!ship) return false;
    if (ship.tier === 0) return true; // Tier 0 ships are always unlocked
    
    // Check if research for this ship is completed
    const researchId = `research_${shipId}`;
    return research.completed.includes(researchId);
  }, [research, player]);

  // AI Logic
  const runAI = useCallback(() => {
    aiPlayers.forEach(ai => {
      const aiPlanets = galaxy.filter(p => p.owner === ai.id);
      const aiFleets = fleets.filter(f => f.owner === ai.id && !f.moving);

      // Random chance to build ships (increased by 50%)
      if (Math.random() < 0.45 && aiPlanets.length > 0) {
        const homePlanet = aiPlanets.find(p => p.structures.shipyard > 0);
        if (homePlanet) {
          // AI builds drones (tier 0, always available)
          const drones = FACTIONS[ai.faction].ships.drone;
          const ship = drones[0]; // Use first available drone
          if (ship && ai.resources.credits >= ship.cost.credits && ai.resources.metal >= ship.cost.metal) {
            setAiPlayers(prev => prev.map(a => a.id === ai.id ? {
              ...a,
              resources: {
                ...a.resources,
                credits: a.resources.credits - ship.cost.credits,
                metal: a.resources.metal - ship.cost.metal
              }
            } : a));

            setFleets(prev => {
              const existingFleet = prev.find(f => f.owner === ai.id && !f.moving);
              if (existingFleet) {
                return prev.map(f => f.id === existingFleet.id ? {
                  ...f,
                  ships: { ...f.ships, [ship.id]: (f.ships[ship.id] || 0) + 1 }
                } : f);
              }
              return prev;
            });
          }
        }
      }

      // Random chance to expand or attack (increased by 50%)
      if (Math.random() < 0.15 && aiFleets.length > 0) {
        const fleet = aiFleets[0];
        const totalShips = Object.values(fleet.ships).reduce((a, b) => a + (b || 0), 0);
        
        if (totalShips >= 3) {
          // Decide whether to expand to neutral or attack enemies
          const neutralPlanets = galaxy.filter(p => p.owner === null);
          const enemyPlanets = galaxy.filter(p => p.owner !== null && p.owner !== ai.id);
          
          // More aggressive: 60% chance to attack if there are enemy planets and fleet is strong enough
          const shouldAttack = totalShips >= 5 && enemyPlanets.length > 0 && Math.random() < 0.6;
          
          if (shouldAttack) {
            const target = enemyPlanets[Math.floor(Math.random() * enemyPlanets.length)];
            setFleets(prev => prev.map(f => 
              f.id === fleet.id ? { ...f, moving: true, destination: target } : f
            ));
          } else if (neutralPlanets.length > 0) {
            const target = neutralPlanets[Math.floor(Math.random() * neutralPlanets.length)];
            setFleets(prev => prev.map(f => 
              f.id === fleet.id ? { ...f, moving: true, destination: target } : f
            ));
          }
        }
      }
    });
  }, [aiPlayers, galaxy, fleets]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setGameTime(t => t + 1);
      
      if (gameTime % 5 === 0) {
        collectResources();
        updateAiPopulation();
        checkFactionElimination();
      }
      moveFleets();
      progressResearch();
      if (gameTime % 10 === 0) runAI();

      // Check win/lose conditions
      const playerPlanets = galaxy.filter(p => p.owner === 'player').length;
      if (playerPlanets === 0 && gameTime > 10) {
        setGameState('gameover');
      }
    }, 1000);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, gameTime, collectResources, updateAiPopulation, moveFleets, progressResearch, runAI, galaxy, checkFactionElimination]);

  return {
    gameState,
    setGameState,
    player,
    aiPlayers,
    galaxy,
    fleets,
    notifications,
    combatLog,
    selectedPlanet,
    setSelectedPlanet,
    selectedFleet,
    setSelectedFleet,
    startGame,
    sendFleet,
    buildShip,
    upgradeStructure,
    colonizePlanet,
    attackPlanet,
    attackFleet,
    gameTime,
    GALAXY_WIDTH,
    GALAXY_HEIGHT,
    research,
    showResearchPanel,
    setShowResearchPanel,
    startResearch,
    isShipUnlocked
  };
}
