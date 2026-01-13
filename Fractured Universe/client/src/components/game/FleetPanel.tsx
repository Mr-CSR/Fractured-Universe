import { type Fleet, type Player, FACTIONS, type Planet, type ShipCategory } from "@/hooks/use-game-engine";
import { X, Rocket, MapPin, Navigation, Swords, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHIP_CATEGORIES: ShipCategory[] = ['drone', 'frigate', 'cruiser', 'battleship', 'capitol'];

interface FleetPanelProps {
  fleets: Fleet[];
  player: Player;
  galaxy: Planet[];
  onClose: () => void;
  onSelectFleet: (fleet: Fleet) => void;
}

export function FleetPanel({ fleets, player, galaxy, onClose, onSelectFleet }: FleetPanelProps) {
  const playerFleets = fleets.filter(f => f.owner === 'player');
  const faction = FACTIONS[player.faction];

  const getShipName = (shipId: string) => {
    for (const category of SHIP_CATEGORIES) {
      const found = faction.ships[category].find(s => s.id === shipId);
      if (found) return found.name;
    }
    return shipId;
  };

  const getFleetLocation = (fleet: Fleet) => {
    const planet = galaxy.find(p => 
      Math.abs(p.x - fleet.x) < 50 && Math.abs(p.y - fleet.y) < 50
    );
    return planet?.name || 'Deep Space';
  };

  const calculateFleetPower = (fleet: Fleet) => {
    let attack = 0;
    let defense = 0;
    
    for (const [shipId, count] of Object.entries(fleet.ships)) {
      if (!count) continue;
      for (const category of SHIP_CATEGORIES) {
        const ship = faction.ships[category].find(s => s.id === shipId);
        if (ship) {
          attack += ship.attack * count;
          defense += ship.defense * count;
          break;
        }
      }
    }
    
    return { attack, defense };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card/95 backdrop-blur-md border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
              <Rocket className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Fleet Command</h2>
              <p className="text-xs text-muted-foreground">{playerFleets.length} active fleets</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-fleets"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {playerFleets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Rocket className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No active fleets</p>
              <p className="text-xs mt-2">Build ships at a planet with a shipyard to create fleets</p>
            </div>
          ) : (
            playerFleets.map(fleet => {
              const totalShips = Object.values(fleet.ships).reduce((a, b) => a + (b || 0), 0);
              const location = getFleetLocation(fleet);
              const power = calculateFleetPower(fleet);
              
              return (
                <div
                  key={fleet.id}
                  className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  onClick={() => {
                    onSelectFleet(fleet);
                    onClose();
                  }}
                  data-testid={`fleet-panel-item-${fleet.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Rocket 
                        className={`h-5 w-5 ${fleet.moving ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`} 
                      />
                      <div>
                        <div className="font-bold text-sm">
                          {totalShips} Ships
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {fleet.moving ? (
                            <>
                              <Navigation size={10} className="text-yellow-400" />
                              <span className="text-yellow-400">En route to {fleet.destination?.name}</span>
                            </>
                          ) : (
                            <>
                              <MapPin size={10} />
                              <span>{location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-red-400">
                        <Swords size={12} />
                        <span className="font-mono">{power.attack}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-400">
                        <Shield size={12} />
                        <span className="font-mono">{power.defense}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(fleet.ships).map(([shipId, count]) => {
                      if (!count || count === 0) return null;
                      return (
                        <span
                          key={shipId}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10"
                        >
                          {getShipName(shipId)} x{count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
