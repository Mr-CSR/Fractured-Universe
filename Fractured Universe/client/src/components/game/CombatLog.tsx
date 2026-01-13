import { type CombatEvent } from "@/hooks/use-game-engine";
import { Swords, Skull, Shield, Target } from "lucide-react";

interface CombatLogProps {
  events: CombatEvent[];
}

export function CombatLog({ events }: CombatLogProps) {
  return (
    <div className="absolute top-6 right-6 w-96 max-h-96 z-30 flex flex-col bg-card/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-red-950/50 to-transparent">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-red-400 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary" data-testid="text-combat-log-title">
            COMBAT LOG
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-xs text-muted-foreground text-center">
            <Shield size={32} className="mx-auto mb-2 opacity-30" />
            No combat recorded
          </div>
        ) : (
          <div className="space-y-0">
            {events.map((event, idx) => {
              const isVictory = event.winner === event.attacker;
              const isDraw = event.winner === 'Draw';
              return (
                <div
                  key={event.id}
                  className={`relative px-4 py-3 border-b border-white/5 text-xs font-mono animate-in fade-in slide-in-from-right-4 duration-500 ${
                    idx === 0 ? 'bg-gradient-to-r from-red-500/10 to-transparent' : ''
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  data-testid={`combat-event-${event.id}`}
                >
                  {/* Flash effect for newest event */}
                  {idx === 0 && (
                    <div className="absolute inset-0 animate-pulse bg-red-500/5" style={{ animationDuration: '1s' }} />
                  )}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="text-slate-500 text-[10px]">[T:{event.timestamp}]</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        isDraw 
                          ? 'text-yellow-400' 
                          : isVictory 
                            ? 'text-green-400' 
                            : 'text-red-400'
                      }`}>
                        {isDraw ? <Target size={12} /> : isVictory ? <Shield size={12} /> : <Skull size={12} />}
                        {event.winner}
                      </span>
                    </div>
                    <div className="text-slate-300 flex items-center gap-2">
                      <span className="text-red-300">{event.attacker}</span>
                      <Swords size={10} className="text-slate-500" />
                      <span className="text-blue-300">{event.defender}</span>
                    </div>
                    <div className="text-slate-500 mt-1.5 flex gap-3">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDuration: '2s' }} />
                        -{Object.values(event.attackerLosses).reduce((a, b) => a + (b || 0), 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDuration: '2.5s' }} />
                        -{Object.values(event.defenderLosses).reduce((a, b) => a + (b || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
