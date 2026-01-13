import { type Planet, type Fleet, type AIPlayer, FACTIONS, type FactionKey } from "@/hooks/use-game-engine";
import { Rocket } from "lucide-react";
import { useMemo } from "react";

interface MapProps {
  galaxy: Planet[];
  fleets: Fleet[];
  playerFaction: FactionKey | undefined;
  aiPlayers: AIPlayer[];
  selectedPlanet: Planet | null;
  selectedFleet: Fleet | null;
  onSelectPlanet: (p: Planet) => void;
  onSelectFleet: (f: Fleet) => void;
  onBackgroundClick: () => void;
  galaxyWidth: number;
  galaxyHeight: number;
}

const PLANET_COLORS: Record<Planet['type'], string> = {
  balanced: '#22c55e',
  desert: '#eab308',
  water: '#3b82f6',
  ice: '#06b6d4',
  forest: '#15803d',
  barren: '#6b7280',
  gas: '#f97316'
};

const PLANET_SIZES: Record<Planet['size'], number> = {
  small: 12,
  medium: 18,
  large: 26
};

interface Star {
  id: number;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
  delay: number;
  duration: number;
}

interface Nebula {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  delay: number;
}

export function Map({ 
  galaxy, 
  fleets,
  playerFaction,
  aiPlayers, 
  selectedPlanet, 
  selectedFleet,
  onSelectPlanet, 
  onSelectFleet,
  onBackgroundClick,
  galaxyWidth,
  galaxyHeight
}: MapProps) {
  
  const getOwnerColor = (owner: Planet['owner']): string => {
    if (owner === 'player' && playerFaction) {
      return FACTIONS[playerFaction].color;
    }
    if (owner) {
      const ai = aiPlayers.find(a => a.id === owner);
      if (ai) return FACTIONS[ai.faction].color;
    }
    return '#374151';
  };

  // Generate random stars for the background
  const stars = useMemo<Star[]>(() => {
    const starCount = Math.floor((galaxyWidth * galaxyHeight) / 8000);
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * galaxyWidth,
      y: Math.random() * galaxyHeight,
      size: Math.random() > 0.9 ? 'large' : Math.random() > 0.6 ? 'medium' : 'small',
      delay: Math.random() * 5,
      duration: 1.5 + Math.random() * 2
    }));
  }, [galaxyWidth, galaxyHeight]);

  // Generate nebula clouds
  const nebulae = useMemo<Nebula[]>(() => {
    const colors = ['#38bdf8', '#a855f7', '#f97316', '#22c55e', '#ef4444'];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * galaxyWidth,
      y: Math.random() * galaxyHeight,
      width: 200 + Math.random() * 400,
      height: 200 + Math.random() * 400,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 10
    }));
  }, [galaxyWidth, galaxyHeight]);

  return (
    <div 
      className="absolute bg-black cursor-grab active:cursor-grabbing" 
      style={{ width: galaxyWidth, height: galaxyHeight }}
      onClick={onBackgroundClick}
    >
      {/* Animated Starfield */}
      <div className="starfield">
        {stars.map(star => (
          <div
            key={star.id}
            className={`star star-${star.size} animate-twinkle`}
            style={{
              left: star.x,
              top: star.y,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>

      {/* Nebula clouds */}
      {nebulae.map(nebula => (
        <div
          key={nebula.id}
          className="nebula"
          style={{
            left: nebula.x,
            top: nebula.y,
            width: nebula.width,
            height: nebula.height,
            backgroundColor: nebula.color,
            animationDelay: `${nebula.delay}s`
          }}
        />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      
      {/* Ambient glow spots */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(56,189,248,0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(239,68,68,0.08) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 60%),
            radial-gradient(circle at 70% 20%, rgba(34,197,94,0.06) 0%, transparent 35%)
          `
        }}
      />

      {/* Planets */}
      {galaxy.map(planet => {
        const ownerColor = getOwnerColor(planet.owner);
        const planetColor = planet.owner ? ownerColor : PLANET_COLORS[planet.type];
        const size = PLANET_SIZES[planet.size];
        const isSelected = selectedPlanet?.id === planet.id;
        const isPlayerOwned = planet.owner === 'player';

        return (
          <div
            key={planet.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: planet.x, top: planet.y }}
            onClick={(e) => { e.stopPropagation(); onSelectPlanet(planet); }}
            data-testid={`planet-${planet.id}`}
          >
            {/* Orbital ring for owned planets */}
            {planet.owner && (
              <div 
                className="absolute rounded-full border animate-orbit-ring pointer-events-none"
                style={{ 
                  width: size + 16, 
                  height: size + 16, 
                  left: -(size + 16) / 2 + size / 2,
                  top: -(size + 16) / 2 + size / 2,
                  borderColor: `${ownerColor}30`,
                  borderStyle: 'dashed',
                  borderWidth: 1
                }}
              />
            )}

            {/* Selection ring with animated pulse */}
            {isSelected && (
              <>
                <div 
                  className="absolute rounded-full border-2 animate-selection-ring pointer-events-none"
                  style={{ 
                    width: size + 24, 
                    height: size + 24, 
                    left: -(size + 24) / 2 + size / 2,
                    top: -(size + 24) / 2 + size / 2,
                    borderColor: ownerColor
                  }}
                />
                {/* Radar sweep effect for selected planet */}
                <div 
                  className="absolute rounded-full pointer-events-none animate-radar-sweep"
                  style={{ 
                    width: size + 40, 
                    height: size + 40, 
                    left: -(size + 40) / 2 + size / 2,
                    top: -(size + 40) / 2 + size / 2,
                    background: `conic-gradient(from 0deg, transparent 0deg, ${ownerColor}40 30deg, transparent 60deg)`
                  }}
                />
              </>
            )}

            {/* Planet body with animated glow */}
            <div 
              className={`rounded-full shadow-lg relative overflow-hidden transition-transform duration-300 group-hover:scale-125 ${isPlayerOwned ? 'animate-pulse-glow' : ''}`}
              style={{ 
                width: size, 
                height: size,
                backgroundColor: planetColor,
                color: planetColor,
                boxShadow: `
                  inset -${size/4}px -${size/4}px ${size/2}px rgba(0,0,0,0.6),
                  0 0 ${size}px ${planetColor}50,
                  0 0 ${size * 2}px ${planetColor}30,
                  0 0 ${size * 3}px ${planetColor}10
                `
              }}
            >
              {/* Highlight */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), transparent 50%)`
                }}
              />
              {/* Surface shimmer for player planets */}
              {isPlayerOwned && (
                <div className="absolute inset-0 animate-shimmer rounded-full" />
              )}
              {/* Rotating surface pattern */}
              <div 
                className="absolute inset-0 opacity-20 animate-planet-rotate"
                style={{
                  background: `repeating-linear-gradient(
                    45deg,
                    transparent 0px,
                    transparent 3px,
                    rgba(0,0,0,0.3) 3px,
                    rgba(0,0,0,0.3) 6px
                  )`
                }}
              />
            </div>

            {/* Planet name tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-1">
              <div 
                className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap px-2 py-0.5 rounded bg-black/90 border border-white/10"
                style={{ color: planetColor }}
              >
                {planet.name}
              </div>
              {planet.owner && (
                <div className="text-[8px] text-white/60 uppercase mt-0.5">
                  {planet.owner === 'player' ? 'YOUR TERRITORY' : 'HOSTILE'}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Fleets with animated engine trails */}
      {fleets.map(fleet => {
        const isPlayer = fleet.owner === 'player';
        const ownerColor = getOwnerColor(fleet.owner);
        const totalShips = Object.values(fleet.ships).reduce((a, b) => a + (b || 0), 0);
        
        const rotation = fleet.destination 
          ? Math.atan2(fleet.destination.y - fleet.y, fleet.destination.x - fleet.x) * (180 / Math.PI) + 90 
          : 0;

        return (
          <div
            key={fleet.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group ${fleet.moving ? 'animate-float' : ''}`}
            style={{ 
              left: fleet.x, 
              top: fleet.y,
              filter: `drop-shadow(0 0 10px ${ownerColor}80)`
            }}
            onClick={(e) => { 
              if (isPlayer) {
                e.stopPropagation(); 
                onSelectFleet(fleet);
              }
            }}
            data-testid={`fleet-${fleet.id}`}
          >
            <div style={{ transform: `rotate(${rotation}deg)` }}>
              <Rocket 
                size={20 + Math.min(totalShips, 20)} 
                style={{ color: ownerColor }}
                className={`transition-all duration-300 ${selectedFleet?.id === fleet.id ? 'scale-125' : ''} ${fleet.moving ? 'animate-pulse-glow' : ''}`}
                fill={selectedFleet?.id === fleet.id ? ownerColor : 'transparent'}
              />
              
              {/* Animated engine trail */}
              {fleet.moving && (
                <>
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 blur-sm animate-fleet-thrust"
                    style={{ 
                      height: 20 + totalShips,
                      background: `linear-gradient(to bottom, ${ownerColor}, ${ownerColor}80, transparent)`,
                      transformOrigin: 'top center'
                    }}
                  />
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 animate-fleet-thrust"
                    style={{ 
                      height: 15 + totalShips * 0.5,
                      background: `linear-gradient(to bottom, white, ${ownerColor}, transparent)`,
                      animationDelay: '0.15s',
                      transformOrigin: 'top center'
                    }}
                  />
                  {/* Particle dots */}
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full animate-twinkle"
                      style={{
                        left: `calc(50% + ${(i - 1) * 4}px)`,
                        top: `${30 + i * 8}px`,
                        backgroundColor: ownerColor,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '0.5s'
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Fleet info tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-1 pointer-events-none">
              <div className="bg-black/95 px-3 py-1.5 rounded border border-white/10 text-[9px] font-mono whitespace-nowrap" style={{ color: ownerColor }}>
                <span className="font-bold">{totalShips}</span> ships
                {fleet.moving && <span className="ml-2 text-white/50">EN ROUTE</span>}
              </div>
            </div>
          </div>
        );
      })}

      {/* Fleet range indicator with animation */}
      {selectedFleet && !selectedFleet.moving && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <linearGradient id="rangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.3)" />
              <stop offset="100%" stopColor="rgba(168,85,247,0.3)" />
            </linearGradient>
          </defs>
          <circle
            cx={selectedFleet.x}
            cy={selectedFleet.y}
            r={300}
            fill="none"
            stroke="url(#rangeGradient)"
            strokeWidth="2"
            strokeDasharray="12 6"
            className="animate-orbit-ring"
            style={{ transformOrigin: `${selectedFleet.x}px ${selectedFleet.y}px` }}
          />
          <circle
            cx={selectedFleet.x}
            cy={selectedFleet.y}
            r={300}
            fill="rgba(56,189,248,0.03)"
            stroke="none"
          />
        </svg>
      )}
    </div>
  );
}
