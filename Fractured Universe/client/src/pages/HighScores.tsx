import { useHighScores } from "@/hooks/use-scores";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { FACTIONS, type FactionKey } from "@/hooks/use-game-engine";

export default function HighScores() {
  const { data: scores, isLoading } = useHighScores();

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      <div className="scanline" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" data-testid="button-return-menu">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Menu
            </Button>
          </Link>
          <Link href="/game">
            <Button variant="outline" data-testid="button-return-game">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Game
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Galactic Archives</h1>
            <p className="text-muted-foreground uppercase tracking-widest mt-2">Top Commanders</p>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {isLoading ? (
             <div className="p-12 text-center text-muted-foreground animate-pulse">Accessing Data Bank...</div>
          ) : scores?.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">No records found. Be the first to conquer the galaxy.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-black/40 text-left">
                <tr>
                  <th className="p-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Rank</th>
                  <th className="p-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Commander</th>
                  <th className="p-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Allegiance</th>
                  <th className="p-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scores?.map((score, i) => {
                  const faction = FACTIONS[score.faction as FactionKey];
                  return (
                    <tr key={score.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-mono text-muted-foreground">
                        {i === 0 ? <Medal className="text-yellow-400" /> : 
                         i === 1 ? <Medal className="text-gray-400" /> :
                         i === 2 ? <Medal className="text-amber-700" /> : 
                         `#${i + 1}`}
                      </td>
                      <td className="p-6 font-bold text-lg">{score.playerName}</td>
                      <td className="p-6">
                        {faction ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-black/40 border border-white/10" style={{ color: faction.color }}>
                            {faction.name}
                          </span>
                        ) : score.faction}
                      </td>
                      <td className="p-6 text-right font-mono text-xl text-primary">{score.score.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
