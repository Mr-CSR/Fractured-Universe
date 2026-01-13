import { type Planet, type Player, type ResearchState, FACTIONS, PLANET_MODIFIERS, getResearchProjectsForFaction } from "@/hooks/use-game-engine";
import { X, Globe, FlaskConical, Factory, Shield, Rocket, Users, Wheat, Hexagon, Battery, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlanetaryPanelProps {
  planets: Planet[];
  player: Player;
  research: ResearchState;
  onClose: () => void;
}

export function PlanetaryPanel({ planets, player, research, onClose }: PlanetaryPanelProps) {
  const playerPlanets = planets.filter(p => p.owner === 'player');
  const faction = FACTIONS[player.faction];
  const projects = getResearchProjectsForFaction(player.faction);

  const totalPopulation = playerPlanets.reduce((sum, p) => sum + p.population, 0);
  const totalMaxPopulation = playerPlanets.reduce((sum, p) => sum + p.maxPopulation, 0);

  const totals = {
    shipyards: playerPlanets.reduce((sum, p) => sum + p.structures.shipyard, 0),
    defenseGrids: playerPlanets.reduce((sum, p) => sum + p.structures.defenseGrid, 0),
    miningFacilities: playerPlanets.reduce((sum, p) => sum + p.structures.miningFacility, 0),
    researchLabs: playerPlanets.reduce((sum, p) => sum + p.structures.researchLab, 0),
  };

  const maxLabLevel = playerPlanets.reduce((max, p) => Math.max(max, p.structures.researchLab), 0);
  const researchSpeedBonus = totals.researchLabs * 20;
  const factionResearchBonus = Math.round((faction.bonuses.research - 1) * 100);
  const totalResearchSpeed = Math.round((1 + totals.researchLabs * 0.2) * faction.bonuses.research * 100);

  const efficiency = faction.bonuses.economy;

  const calculatePlanetIncome = (planet: Planet) => {
    const mods = PLANET_MODIFIERS[planet.type];
    const metalMod = 1 + mods.metal / 100;
    const he3Mod = 1 + mods.he3 / 100;
    const foodMod = 1 + mods.food / 100;
    
    const credits = Math.floor((planet.baseIncome + planet.population * 0.5) * efficiency);
    const metal = Math.max(0, Math.floor((planet.structures.miningFacility * 15 + 5) * metalMod * efficiency));
    const he3 = Math.max(0, Math.floor(10 * he3Mod * efficiency));
    const food = Math.max(0, Math.floor(10 * foodMod * efficiency));
    
    return { credits, metal, he3, food };
  };

  const totalIncome = playerPlanets.reduce((acc, p) => {
    const income = calculatePlanetIncome(p);
    return {
      credits: acc.credits + income.credits,
      metal: acc.metal + income.metal,
      he3: acc.he3 + income.he3,
      food: acc.food + income.food,
    };
  }, { credits: 0, metal: 0, he3: 0, food: 0 });

  const foodRequired = Math.floor(totalPopulation / 10);
  const netFood = totalIncome.food - foodRequired;

  const completedResearch = research.completed.length;
  const totalResearch = projects.length;
  const currentProject = research.current ? projects.find(p => p.id === research.current) : null;
  const currentProgress = currentProject ? Math.min(100, (research.progress / currentProject.researchTime) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card/95 backdrop-blur-md border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Planetary Management</h2>
              <p className="text-xs text-muted-foreground">{playerPlanets.length} planets under your control</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-planetary"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs text-muted-foreground">Credits/tick</span>
              </div>
              <div className="text-lg font-bold text-yellow-400" data-testid="text-total-credits-income">
                +{totalIncome.credits.toFixed(1)}
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Hexagon size={14} className="text-blue-400" />
                <span className="text-xs text-muted-foreground">Metal/tick</span>
              </div>
              <div className="text-lg font-bold text-blue-400" data-testid="text-total-metal-income">
                +{totalIncome.metal.toFixed(1)}
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Battery size={14} className="text-green-400" />
                <span className="text-xs text-muted-foreground">HE3/tick</span>
              </div>
              <div className="text-lg font-bold text-green-400" data-testid="text-total-he3-income">
                +{totalIncome.he3.toFixed(1)}
              </div>
            </div>
            <div className={`${netFood >= 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Wheat size={14} className={netFood >= 0 ? 'text-orange-400' : 'text-red-400'} />
                <span className="text-xs text-muted-foreground">Net Food/tick</span>
              </div>
              <div className={`text-lg font-bold ${netFood >= 0 ? 'text-orange-400' : 'text-red-400'}`} data-testid="text-total-food-income">
                {netFood >= 0 ? '+' : ''}{netFood}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                +{totalIncome.food} produced, -{foodRequired} consumed
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Users size={16} className="text-cyan-400" />
              Population Overview
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total Population</span>
                  <span className="font-mono">{totalPopulation.toLocaleString()} / {totalMaxPopulation.toLocaleString()}</span>
                </div>
                <Progress value={totalMaxPopulation > 0 ? (totalPopulation / totalMaxPopulation) * 100 : 0} className="h-2" />
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Factory size={16} className="text-blue-400" />
              Total Infrastructure
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Rocket size={14} className="text-cyan-400" />
                <span className="text-muted-foreground">Shipyards:</span>
                <span className="font-bold">{totals.shipyards}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-red-400" />
                <span className="text-muted-foreground">Defense:</span>
                <span className="font-bold">{totals.defenseGrids}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Factory size={14} className="text-blue-400" />
                <span className="text-muted-foreground">Mining:</span>
                <span className="font-bold">{totals.miningFacilities}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FlaskConical size={14} className="text-purple-400" />
                <span className="text-muted-foreground">Labs:</span>
                <span className="font-bold">{totals.researchLabs}</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <FlaskConical size={16} className="text-purple-400" />
              Research Overview
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Max Lab Level:</span>
                  <span className="font-bold ml-2">Lv.{maxLabLevel}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Research Speed:</span>
                  <span className="font-bold ml-2 text-purple-400">{totalResearchSpeed}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lab Bonus:</span>
                  <span className="font-bold ml-2 text-green-400">+{researchSpeedBonus}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Faction Bonus:</span>
                  <span className="font-bold ml-2" style={{ color: faction.color }}>
                    {factionResearchBonus >= 0 ? '+' : ''}{factionResearchBonus}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Research Progress</span>
                  <span className="font-mono">{completedResearch} / {totalResearch} completed</span>
                </div>
                <Progress value={(completedResearch / totalResearch) * 100} className="h-2 mb-2" />
                
                {currentProject && (
                  <div className="mt-3 p-3 bg-black/30 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-purple-400 font-medium">Currently Researching:</span>
                      <span className="font-bold">{currentProject.name}</span>
                    </div>
                    <Progress value={currentProgress} className="h-1.5" />
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {currentProgress.toFixed(0)}% complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <h3 className="font-bold mb-3">Research Effects</h3>
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                Each Research Lab level adds <span className="text-purple-400 font-bold">+20%</span> research speed.
              </p>
              <p className="text-muted-foreground">
                Your {faction.name} faction has a base research modifier of{' '}
                <span className="font-bold" style={{ color: faction.color }}>
                  {factionResearchBonus >= 0 ? '+' : ''}{factionResearchBonus}%
                </span>.
              </p>
              <p className="text-muted-foreground">
                Completed research unlocks new ship types for construction at shipyards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
