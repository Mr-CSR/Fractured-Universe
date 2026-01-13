import { type Planet, type Fleet, type Player, type ShipCategory, type ShipType, FACTIONS } from "@/hooks/use-game-engine";
import { Shield, TrendingUp, Factory, FlaskConical, Rocket, X, Users, Zap, Lock, Swords, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  selectedPlanet: Planet | null;
  selectedFleet: Fleet | null;
  player: Player | null;
  fleets: Fleet[];
  onBuildShip: (planetId: string, shipId: string) => void;
  onUpgradeStructure: (planetId: string, structure: keyof Planet['structures']) => void;
  onSendFleet: (fleet: Fleet, destination: Planet) => void;
  onColonize: (planetId: string, fleetId: string) => void;
  onAttackPlanet: (fleet: Fleet, planet: Planet) => void;
  onAttackFleet: (attackerFleet: Fleet, defenderFleet: Fleet) => void;
  onClose: () => void;
  isShipUnlocked: (shipId: string) => boolean;
}

const SHIP_CATEGORIES: ShipCategory[] = ['drone', 'frigate', 'cruiser', 'battleship', 'capitol'];

const STRUCTURE_INFO = {
  shipyard: { icon: Rocket, label: 'Shipyard', color: 'text-blue-400', desc: 'Build ships faster' },
  defenseGrid: { icon: Shield, label: 'Defense Grid', color: 'text-red-400', desc: '+50 defense per level' },
  miningFacility: { icon: Factory, label: 'Mining Facility', color: 'text-yellow-400', desc: '+15 metal/tick' },
  researchLab: { icon: FlaskConical, label: 'Research Lab', color: 'text-purple-400', desc: 'Unlock technologies' }
};

export function Sidebar({ 
  selectedPlanet, 
  selectedFleet, 
  player,
  fleets,
  onBuildShip,
  onUpgradeStructure,
  onSendFleet,
  onColonize,
  onAttackPlanet,
  onAttackFleet,
  onClose,
  isShipUnlocked
}: SidebarProps) {
  
  if (!selectedPlanet && !selectedFleet) return null;

  const faction = player ? FACTIONS[player.faction] : null;
  
  // Find player fleet near selected planet
  const playerFleetNearPlanet = selectedPlanet ? fleets.find(f => 
    f.owner === 'player' && 
    !f.moving && 
    Math.abs(f.x - selectedPlanet.x) < 50 && 
    Math.abs(f.y - selectedPlanet.y) < 50
  ) : null;

  // Find enemy fleets near the selected player fleet
  const enemyFleetsNearby = selectedFleet && selectedFleet.owner === 'player' ? fleets.filter(f => 
    f.owner !== 'player' && 
    !f.moving && 
    Math.abs(f.x - selectedFleet.x) < 100 && 
    Math.abs(f.y - selectedFleet.y) < 100
  ) : [];

  return (
    <div className="absolute top-20 right-4 bottom-20 w-80 lg:w-96 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl z-40 animate-in slide-in-from-right-10 duration-300 overflow-hidden">
      <button 
        onClick={onClose} 
        className="absolute top-3 right-3 text-muted-foreground hover:text-white z-10"
        data-testid="button-close-sidebar"
      >
        <X size={18}/>
      </button>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {selectedPlanet && (
          <>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground font-bold tracking-widest mb-1">
                {selectedPlanet.type} World
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-planet-name">
                {selectedPlanet.name}
              </h2>
              <div className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-2 ${
                selectedPlanet.owner === 'player' 
                  ? 'bg-primary/20 text-primary' 
                  : selectedPlanet.owner 
                    ? 'bg-red-500/20 text-red-500' 
                    : 'bg-slate-700 text-slate-400'
              }`}>
                {selectedPlanet.owner === 'player' ? 'Your Territory' : selectedPlanet.owner ? 'Hostile' : 'Unclaimed'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 mb-1 text-green-400">
                  <TrendingUp size={12} />
                  <span className="text-[9px] font-bold uppercase">Income</span>
                </div>
                <div className="text-lg font-mono">+{selectedPlanet.baseIncome}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 mb-1 text-blue-400">
                  <Shield size={12} />
                  <span className="text-[9px] font-bold uppercase">Defense</span>
                </div>
                <div className="text-lg font-mono">{selectedPlanet.defense}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 mb-1 text-cyan-400">
                  <Users size={12} />
                  <span className="text-[9px] font-bold uppercase">Population</span>
                </div>
                <div className="text-lg font-mono">{selectedPlanet.population}/{selectedPlanet.maxPopulation}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-1.5 mb-1 text-yellow-400">
                  <Zap size={12} />
                  <span className="text-[9px] font-bold uppercase">Size</span>
                </div>
                <div className="text-lg font-mono capitalize">{selectedPlanet.size}</div>
              </div>
            </div>

            {selectedPlanet.owner === 'player' && faction && (
              <>
                <div className="pt-3 border-t border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Structures
                  </h3>
                  <div className="space-y-2">
                    {(Object.keys(STRUCTURE_INFO) as (keyof typeof STRUCTURE_INFO)[]).map(key => {
                      const info = STRUCTURE_INFO[key];
                      const Icon = info.icon;
                      const level = selectedPlanet.structures[key];
                      return (
                        <div key={key} className="flex items-center justify-between bg-black/30 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className={info.color} />
                            <div>
                              <div className="text-xs font-medium">{info.label}</div>
                              <div className="text-[9px] text-muted-foreground">Lv.{level}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpgradeStructure(selectedPlanet.id, key)}
                            className="h-7 text-[10px] border-white/10"
                            data-testid={`button-upgrade-${key}`}
                          >
                            Upgrade
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPlanet.structures.shipyard > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Shipyard
                    </h3>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {SHIP_CATEGORIES.map(category => 
                        faction.ships[category].map(ship => {
                          const unlocked = isShipUnlocked(ship.id);
                          const canAfford = player && unlocked &&
                            player.resources.credits >= ship.cost.credits && 
                            player.resources.metal >= ship.cost.metal;
                          
                          return (
                            <Button
                              key={ship.id}
                              onClick={() => unlocked && onBuildShip(selectedPlanet.id, ship.id)}
                              disabled={!canAfford}
                              variant="outline"
                              className={`w-full justify-between h-auto py-2 text-left border-white/10 disabled:opacity-40 ${!unlocked ? 'opacity-50' : ''}`}
                              data-testid={`button-build-${ship.id}`}
                            >
                              <div className="flex items-center gap-2">
                                {!unlocked && <Lock size={12} className="text-muted-foreground" />}
                                <div>
                                  <div className="text-xs font-medium">{ship.name}{!unlocked ? ' (Locked)' : ''}</div>
                                  <div className="text-[9px] text-muted-foreground">
                                    {unlocked ? `ATK: ${ship.attack} | DEF: ${ship.defense}` : 'Research required'}
                                  </div>
                                </div>
                              </div>
                              {unlocked && (
                                <div className="text-right text-[9px] font-mono">
                                  <div className="text-yellow-400">{ship.cost.credits}c</div>
                                  <div className="text-slate-400">{ship.cost.metal}m</div>
                                </div>
                              )}
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedPlanet.owner === null && selectedFleet && selectedFleet.owner === 'player' && (
              <div className="pt-3">
                <Button
                  onClick={() => onColonize(selectedPlanet.id, selectedFleet.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-colonize"
                >
                  Colonize Planet
                </Button>
              </div>
            )}

            {selectedPlanet.owner !== 'player' && selectedPlanet.owner !== null && playerFleetNearPlanet && (
              <div className="pt-3 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                  <Swords size={14} />
                  Combat Options
                </h3>
                <Button
                  onClick={() => onAttackPlanet(playerFleetNearPlanet, selectedPlanet)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="button-attack-planet"
                >
                  <Target className="mr-2" size={16} />
                  Attack {selectedPlanet.name}
                </Button>
                <p className="text-[9px] text-muted-foreground mt-2 text-center">
                  Your fleet is in position to attack this hostile planet
                </p>
              </div>
            )}
          </>
        )}

        {selectedFleet && (
          <div className="pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Fleet Composition
            </h3>
            <div className="space-y-1">
              {Object.entries(selectedFleet.ships).map(([shipId, count]) => {
                if (!count || count === 0) return null;
                // Find ship name from faction data
                let shipName = shipId;
                if (faction) {
                  for (const category of SHIP_CATEGORIES) {
                    const found = faction.ships[category].find(s => s.id === shipId);
                    if (found) {
                      shipName = found.name;
                      break;
                    }
                  }
                }
                return (
                  <div key={shipId} className="flex items-center justify-between bg-black/30 p-2 rounded text-xs">
                    <span>{shipName}</span>
                    <span className="font-mono text-primary">x{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground">
              {selectedFleet.moving ? 'In transit...' : 'Awaiting orders'}
            </div>
          </div>
        )}

        {selectedFleet && selectedFleet.owner === 'player' && !selectedFleet.moving && enemyFleetsNearby.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
              <Swords size={14} />
              Enemy Fleets In Range
            </h3>
            <div className="space-y-2">
              {enemyFleetsNearby.map(enemyFleet => {
                const shipCount = Object.values(enemyFleet.ships).reduce((a, b) => a + (b || 0), 0);
                return (
                  <Button
                    key={enemyFleet.id}
                    onClick={() => onAttackFleet(selectedFleet, enemyFleet)}
                    variant="outline"
                    className="w-full justify-between border-red-500/50 text-red-400 hover:bg-red-500/20"
                    data-testid={`button-attack-fleet-${enemyFleet.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Swords size={14} />
                      <span>Enemy Fleet</span>
                    </div>
                    <span className="text-xs font-mono">{shipCount} ships</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedFleet && !selectedFleet.moving && selectedPlanet && selectedPlanet.owner !== 'player' && (
        <div className="p-4 border-t border-white/10 bg-black/40">
          <Button
            onClick={() => onSendFleet(selectedFleet, selectedPlanet)}
            className="w-full"
            style={{ backgroundColor: faction?.color }}
            data-testid="button-send-fleet"
          >
            <Rocket className="mr-2" size={16} />
            Send Fleet to {selectedPlanet.name}
          </Button>
        </div>
      )}
    </div>
  );
}
