import { type ResourceType, type ResearchState } from "@/hooks/use-game-engine";
import { Zap, Hexagon, Battery, Pause, Play, Rocket, Globe, FlaskConical, Wheat } from "lucide-react";

interface HUDProps {
  resources: Record<ResourceType, number>;
  gameTime: number;
  planetsOwned: number;
  totalPlanets: number;
  onPause: () => void;
  isPaused: boolean;
  research: ResearchState;
  onOpenResearch: () => void;
  onOpenFleets: () => void;
  onOpenPlanetary: () => void;
  totalResearchProjects: number;
  totalFleets: number;
}

export function HUD({ resources, gameTime, planetsOwned, totalPlanets, onPause, isPaused, research, onOpenResearch, onOpenFleets, onOpenPlanetary, totalResearchProjects, totalFleets }: HUDProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background via-background/95 to-transparent z-40 flex items-center justify-between px-4 lg:px-6 pointer-events-none">
      <div className="flex gap-4 lg:gap-6 pointer-events-auto">
        <div className="flex flex-col group">
          <span className="text-[8px] lg:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Credits</span>
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Zap size={14} className="fill-yellow-400/30 animate-pulse" style={{ animationDuration: '2s' }} />
            <span className="text-lg lg:text-xl font-display font-bold transition-all group-hover:scale-110 group-hover:text-yellow-300" data-testid="text-credits">
              {Math.floor(resources.credits).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col group">
          <span className="text-[8px] lg:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Metal</span>
          <div className="flex items-center gap-1.5 text-blue-400">
            <Hexagon size={14} className="fill-blue-400/30 animate-pulse" style={{ animationDuration: '2.5s' }} />
            <span className="text-lg lg:text-xl font-display font-bold transition-all group-hover:scale-110 group-hover:text-blue-300" data-testid="text-metal">
              {Math.floor(resources.metal).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col group">
          <span className="text-[8px] lg:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">HE3</span>
          <div className="flex items-center gap-1.5 text-green-400">
            <Battery size={14} className="fill-green-400/30 animate-pulse" style={{ animationDuration: '3s' }} />
            <span className="text-lg lg:text-xl font-display font-bold transition-all group-hover:scale-110 group-hover:text-green-300" data-testid="text-he3">
              {Math.floor(resources.he3).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col group">
          <span className="text-[8px] lg:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Food</span>
          <div className="flex items-center gap-1.5 text-orange-400">
            <Wheat size={14} className="fill-orange-400/30 animate-pulse" style={{ animationDuration: '2.8s' }} />
            <span className="text-lg lg:text-xl font-display font-bold transition-all group-hover:scale-110 group-hover:text-orange-300" data-testid="text-food">
              {Math.floor(resources.food).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-[8px] uppercase text-primary/60 tracking-[0.3em] animate-pulse" style={{ animationDuration: '4s' }}>Mission Time</div>
        <div className="font-mono text-base lg:text-lg text-primary font-bold relative" data-testid="text-game-time">
          <span className="relative z-10">{formatTime(gameTime)}</span>
          <div className="absolute inset-0 blur-sm bg-primary/20 animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onOpenPlanetary}
          className="flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 hover:border-emerald-400 hover:bg-emerald-600 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] group"
          data-testid="button-open-planetary"
        >
          <Globe size={14} className="text-emerald-400 group-hover:text-white group-hover:animate-pulse" />
          <span className="text-sm font-mono group-hover:text-white transition-colors" data-testid="text-planets-owned">
            {planetsOwned}/{totalPlanets}
          </span>
        </button>
        <button 
          onClick={onOpenResearch}
          className="relative p-2.5 rounded-lg bg-card/50 hover:bg-purple-600 hover:text-white transition-all border border-white/10 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] group"
          data-testid="button-open-research"
        >
          <FlaskConical size={16} className="group-hover:animate-pulse" />
          {research.current && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
          )}
          {research.current && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full" />
          )}
          {research.completed.length < totalResearchProjects && !research.current && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDuration: '1s' }} />
          )}
        </button>
        <button 
          onClick={onOpenFleets}
          className="relative p-2.5 rounded-lg bg-card/50 hover:bg-cyan-600 hover:text-white transition-all border border-white/10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] group"
          data-testid="button-open-fleets"
        >
          <Rocket size={16} className="group-hover:animate-pulse" />
          {totalFleets > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-cyan-500 text-white rounded-full px-1">
              {totalFleets}
            </span>
          )}
        </button>
        <button 
          onClick={onPause}
          className={`p-2.5 rounded-lg bg-card/50 hover:bg-primary hover:text-black transition-all border border-white/10 hover:border-primary hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] ${isPaused ? 'animate-pulse bg-yellow-500/20 border-yellow-500/50' : ''}`}
          data-testid="button-pause"
        >
          {isPaused ? <Play size={16} className="text-yellow-400" /> : <Pause size={16} />}
        </button>
      </div>
    </div>
  );
}
