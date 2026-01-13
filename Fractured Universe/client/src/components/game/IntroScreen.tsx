import { FACTIONS, type FactionKey } from "@/hooks/use-game-engine";
import { Shield, Zap, FlaskConical, Crosshair, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface IntroScreenProps {
  onStart: (faction: FactionKey) => void;
}

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  const [selectedFaction, setSelectedFaction] = useState<FactionKey | null>(null);
  const [showLore, setShowLore] = useState(false);
  const [titleGlow, setTitleGlow] = useState(0);

  // Animated title glow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTitleGlow(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate background stars
  const stars = useMemo<StarParticle[]>(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1,
      delay: Math.random() * 5,
      duration: 1.5 + Math.random() * 2
    }));
  }, []);

  const handleStart = () => {
    if (selectedFaction) {
      onStart(selectedFaction);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background overflow-auto">
      {/* Animated starfield background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              boxShadow: star.size > 2 ? '0 0 4px white' : 'none'
            }}
          />
        ))}
        {/* Nebula effects */}
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500 blur-[120px] opacity-10 -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full bg-purple-500 blur-[120px] opacity-10 -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 rounded-full bg-orange-500 blur-[100px] opacity-5 top-1/3 right-1/4 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter mb-4 relative"
            style={{
              background: `linear-gradient(${135 + titleGlow * 0.5}deg, #38bdf8 0%, #a855f7 50%, #fbbf24 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 ${40 + Math.sin(titleGlow * 0.05) * 20}px rgba(56,189,248,0.4))`
            }}
            data-testid="text-game-title"
          >
            FRACTURED UNIVERSE
            <Sparkles 
              className="absolute -top-4 -right-4 text-yellow-400 animate-pulse" 
              size={24} 
              style={{ animationDuration: '1s' }}
            />
          </h1>
          <p className="text-muted-foreground text-sm md:text-base uppercase tracking-[0.3em]">
            Choose Your Empire
          </p>
        </div>

        {!showLore ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl w-full px-4 animate-in fade-in duration-500">
            {(Object.entries(FACTIONS) as [FactionKey, typeof FACTIONS['tarren']][]).map(([key, faction], i) => (
              <button
                key={key}
                onClick={() => setSelectedFaction(key)}
                className={`group relative overflow-hidden rounded-xl border bg-card/40 hover:bg-card/70 transition-all duration-300 text-left p-6 ${
                  selectedFaction === key 
                    ? 'border-2 shadow-[0_0_40px_rgba(255,255,255,0.2)]' 
                    : 'border-white/5 hover:border-white/20'
                }`}
                style={{ 
                  borderColor: selectedFaction === key ? faction.color : undefined,
                  animationDelay: `${i * 80}ms` 
                }}
                data-testid={`button-faction-${key}`}
              >
                <div 
                  className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
                  style={{ background: `radial-gradient(circle at top right, ${faction.color}, transparent 70%)` }}
                />
                
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Crosshair size={80} style={{ color: faction.color }} />
                </div>

                <div className="relative z-10">
                  <h2 
                    className="text-xl md:text-2xl font-display font-bold mb-2"
                    style={{ color: faction.color }}
                  >
                    {faction.name}
                  </h2>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed line-clamp-2">
                    {faction.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap size={12} className="text-yellow-400" /> Economy
                      </span>
                      <div className="h-1.5 w-20 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 transition-all" 
                          style={{ width: `${(faction.bonuses.economy - 0.7) * 150}%` }} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Shield size={12} className="text-red-400" /> Combat
                      </span>
                      <div className="h-1.5 w-20 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-400 transition-all" 
                          style={{ width: `${(faction.bonuses.combat - 0.7) * 150}%` }} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <FlaskConical size={12} className="text-purple-400" /> Research
                      </span>
                      <div className="h-1.5 w-20 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-400 transition-all" 
                          style={{ width: `${(faction.bonuses.research - 0.7) * 150}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <p className="text-[10px] italic text-muted-foreground">"{faction.motto}"</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="max-w-3xl w-full px-4 animate-in fade-in duration-500">
            {selectedFaction && (
              <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold"
                    style={{ backgroundColor: FACTIONS[selectedFaction].color + '30', color: FACTIONS[selectedFaction].color }}
                  >
                    {FACTIONS[selectedFaction].name[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold" style={{ color: FACTIONS[selectedFaction].color }}>
                      {FACTIONS[selectedFaction].name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{FACTIONS[selectedFaction].description}</p>
                  </div>
                </div>
                
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {FACTIONS[selectedFaction].lore}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-center italic text-lg" style={{ color: FACTIONS[selectedFaction].color }}>
                    "{FACTIONS[selectedFaction].motto}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedFaction && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setShowLore(!showLore)}
              className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors text-sm uppercase tracking-wider"
              data-testid="button-toggle-lore"
            >
              {showLore ? 'Back to Selection' : 'Read Faction Lore'}
            </button>
            <button
              onClick={handleStart}
              className="relative px-10 py-3 rounded-lg font-bold text-black text-lg uppercase tracking-wider transition-all hover:scale-105 overflow-hidden group"
              style={{ backgroundColor: FACTIONS[selectedFaction].color }}
              data-testid="button-start-game"
            >
              <span className="relative z-10">Launch Campaign</span>
              <div 
                className="absolute inset-0 animate-shimmer opacity-30"
                style={{ background: 'linear-gradient(90deg, transparent, white, transparent)', backgroundSize: '200% 100%' }}
              />
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `0 0 40px ${FACTIONS[selectedFaction].color}, inset 0 0 20px rgba(255,255,255,0.3)` }}
              />
            </button>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-muted-foreground/50 uppercase tracking-widest">
          <p>150 Star Systems to Conquer</p>
        </div>
      </div>
    </div>
  );
}
