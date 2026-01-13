import { type Player, type ResearchState, type ResearchProject, type ShipCategory, FACTIONS, getResearchProjectsForFaction } from "@/hooks/use-game-engine";
import { FlaskConical, Lock, Check, Loader2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ResearchPanelProps {
  player: Player;
  research: ResearchState;
  maxLabLevel: number;
  onStartResearch: (projectId: string) => void;
  onClose: () => void;
}

export function ResearchPanel({ player, research, maxLabLevel, onStartResearch, onClose }: ResearchPanelProps) {
  const faction = FACTIONS[player.faction];
  const projects = getResearchProjectsForFaction(player.faction);

  const getProjectStatus = (projectId: string) => {
    if (research.completed.includes(projectId)) return 'completed';
    if (research.current === projectId) return 'researching';
    return 'available';
  };

  const canResearch = (project: ResearchProject) => {
    if (research.completed.includes(project.id)) return false;
    if (research.current) return false;
    if (!project.prerequisites.every(prereq => research.completed.includes(prereq))) return false;
    if (maxLabLevel < project.requiredLab) return false;
    if (player.resources.credits < project.cost.credits || player.resources.he3 < project.cost.he3) return false;
    return true;
  };

  const getCurrentProgress = () => {
    if (!research.current) return 0;
    const project = projects.find(p => p.id === research.current);
    if (!project) return 0;
    return Math.min(100, (research.progress / project.researchTime) * 100);
  };

  const findShipById = (shipId: string) => {
    for (const category of Object.keys(faction.ships) as ShipCategory[]) {
      const found = faction.ships[category].find(s => s.id === shipId);
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="absolute inset-4 lg:inset-8 bg-card/98 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${faction.color}20` }}>
            <FlaskConical size={24} style={{ color: faction.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold" data-testid="text-research-title">Research Lab</h2>
            <p className="text-sm text-muted-foreground">Unlock new ships for your fleet</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-research">
          <X size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 max-w-4xl mx-auto">
          {projects.map((project, index) => {
            const status = getProjectStatus(project.id);
            const ship = findShipById(project.shipUnlockId);
            const prereqsMet = project.prerequisites.every(prereq => research.completed.includes(prereq));
            const labMet = maxLabLevel >= project.requiredLab;
            const canAfford = player.resources.credits >= project.cost.credits && player.resources.he3 >= project.cost.he3;

            if (!ship) return null;

            return (
              <div 
                key={project.id}
                className={`relative rounded-xl border p-5 transition-all duration-300 ${
                  status === 'completed' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : status === 'researching'
                      ? 'bg-primary/10 border-primary/30 animate-pulse'
                      : prereqsMet 
                        ? 'bg-black/40 border-white/10 hover:border-white/20' 
                        : 'bg-black/20 border-white/5 opacity-60'
                }`}
                data-testid={`research-project-${project.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : status === 'researching'
                        ? 'bg-primary/20 text-primary'
                        : prereqsMet
                          ? 'bg-white/10 text-white'
                          : 'bg-white/5 text-white/30'
                  }`}>
                    {status === 'completed' ? (
                      <Check size={28} />
                    ) : status === 'researching' ? (
                      <Loader2 size={28} className="animate-spin" />
                    ) : prereqsMet ? (
                      index + 1
                    ) : (
                      <Lock size={24} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{ship.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-white/10 text-muted-foreground">
                        {project.category}
                      </span>
                      {status === 'completed' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/20 text-green-400">
                          Unlocked
                        </span>
                      )}
                      {status === 'researching' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30">
                        <span className="text-muted-foreground">ATK:</span>
                        <span className="font-mono text-red-400">{ship.attack}</span>
                        <span className="text-muted-foreground ml-2">DEF:</span>
                        <span className="font-mono text-blue-400">{ship.defense}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/30">
                        <span className="text-muted-foreground">Build Cost:</span>
                        <span className="font-mono text-yellow-400">{ship.cost.credits}c</span>
                        <span className="font-mono text-slate-400">{ship.cost.metal}m</span>
                      </div>
                      {!labMet && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 text-red-400">
                          <Lock size={12} />
                          <span>Requires Lab Lv.{project.requiredLab}</span>
                        </div>
                      )}
                    </div>

                    {status === 'researching' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Research Progress</span>
                          <span className="font-mono">{Math.floor(getCurrentProgress())}%</span>
                        </div>
                        <Progress value={getCurrentProgress()} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs space-y-1 mb-3">
                      <div className={`font-mono ${canAfford || status !== 'available' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {project.cost.credits.toLocaleString()}c
                      </div>
                      <div className={`font-mono ${canAfford || status !== 'available' ? 'text-green-400' : 'text-red-400'}`}>
                        {project.cost.he3.toLocaleString()} HE3
                      </div>
                    </div>

                    {status === 'available' && prereqsMet && (
                      <Button
                        onClick={() => onStartResearch(project.id)}
                        disabled={!canResearch(project)}
                        size="sm"
                        className="gap-1"
                        style={{ backgroundColor: canResearch(project) ? faction.color : undefined }}
                        data-testid={`button-research-${project.id}`}
                      >
                        Research
                        <ChevronRight size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {!prereqsMet && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-muted-foreground">
                    Requires: {project.prerequisites.map(p => {
                      const prereqProject = projects.find(r => r.id === p);
                      const prereqShip = prereqProject ? findShipById(prereqProject.shipUnlockId) : null;
                      return prereqShip?.name || p;
                    }).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/30">
        <div className="flex items-center justify-between max-w-4xl mx-auto text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} className="text-purple-400" />
              <span className="text-muted-foreground">Max Lab Level:</span>
              <span className="font-bold">{maxLabLevel}</span>
            </div>
            <div className="text-muted-foreground">
              Research Bonus: <span className="font-bold text-purple-400">+{Math.floor((faction.bonuses.research - 1) * 100)}%</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            {research.completed.length} / {projects.length} researched
          </div>
        </div>
      </div>
    </div>
  );
}
