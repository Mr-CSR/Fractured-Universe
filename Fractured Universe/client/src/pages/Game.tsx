import { useGameEngine, getResearchProjectsForFaction } from "@/hooks/use-game-engine";
import { IntroScreen } from "@/components/game/IntroScreen";
import { HUD } from "@/components/game/HUD";
import { Map } from "@/components/game/Map";
import { Sidebar } from "@/components/game/Sidebar";
import { NotificationFeed } from "@/components/game/NotificationFeed";
import { CombatLog } from "@/components/game/CombatLog";
import { ResearchPanel } from "@/components/game/ResearchPanel";
import { FleetPanel } from "@/components/game/FleetPanel";
import { PlanetaryPanel } from "@/components/game/PlanetaryPanel";
import { useCreateHighScore } from "@/hooks/use-scores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

export default function Game() {
  const engine = useGameEngine();
  const createScore = useCreateHighScore();
  const [, setLocation] = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const [showPlanetaryPanel, setShowPlanetaryPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(40);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (engine.gameState === 'playing' && engine.player) {
      const homeworld = engine.galaxy.find(p => p.id === engine.player?.homeworld);
      if (homeworld) {
        setPanOffset({
          x: -homeworld.x * (zoomLevel / 100) + window.innerWidth / 2,
          y: -homeworld.y * (zoomLevel / 100) + window.innerHeight / 2
        });
      }
    }
  }, [engine.gameState, engine.player?.homeworld]);

  const handleZoom = (direction: 'in' | 'out') => {
    const increment = 10;
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev + increment : prev - increment;
      return Math.max(20, Math.min(150, newZoom));
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 'in' : 'out');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const centerOnHomeworld = () => {
    const homeworld = engine.galaxy.find(p => p.id === engine.player?.homeworld);
    if (homeworld) {
      setPanOffset({
        x: -homeworld.x * (zoomLevel / 100) + window.innerWidth / 2,
        y: -homeworld.y * (zoomLevel / 100) + window.innerHeight / 2
      });
    }
  };

  const handleGameOver = async () => {
    if (!playerName.trim() || !engine.player) return;
    
    const score = Math.floor(
      (engine.player.resources.credits / 10) + 
      (engine.player.resources.metal / 5) + 
      (engine.galaxy.filter(p => p.owner === 'player').length * 500) +
      engine.player.score
    );

    try {
      await createScore.mutateAsync({
        playerName,
        score,
        faction: engine.player.faction
      });
      setLocation('/leaderboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden select-none">
      <div className="scanline" />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background pointer-events-none" />

      {engine.gameState === 'menu' && (
        <IntroScreen onStart={engine.startGame} />
      )}

      {engine.gameState === 'gameover' && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <h1 className="text-6xl text-red-500 font-display font-black mb-4" data-testid="text-game-over">
            GAME OVER
          </h1>
          <p className="text-muted-foreground mb-8">Your empire has fallen.</p>
          
          <div className="bg-card p-6 rounded-xl border border-white/10 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold">Submit Your Score</h3>
            <Input 
              placeholder="Commander Name" 
              value={playerName} 
              onChange={e => setPlayerName(e.target.value)}
              className="bg-black/50 border-white/20"
              data-testid="input-player-name"
            />
            <Button 
              onClick={handleGameOver} 
              className="w-full"
              disabled={!playerName.trim() || createScore.isPending}
              data-testid="button-submit-score"
            >
              {createScore.isPending ? 'Submitting...' : 'Submit to Leaderboard'}
            </Button>
            <Button
              variant="outline"
              onClick={() => engine.setGameState('menu')}
              className="w-full"
              data-testid="button-play-again"
            >
              Play Again
            </Button>
          </div>
        </div>
      )}

      {(engine.gameState === 'playing' || engine.gameState === 'paused') && engine.player && (
        <>
          <HUD 
            resources={engine.player.resources}
            gameTime={engine.gameTime}
            planetsOwned={engine.galaxy.filter(p => p.owner === 'player').length}
            totalPlanets={engine.galaxy.length}
            onPause={() => engine.setGameState(engine.gameState === 'paused' ? 'playing' : 'paused')}
            isPaused={engine.gameState === 'paused'}
            research={engine.research}
            onOpenResearch={() => engine.setShowResearchPanel(true)}
            onOpenFleets={() => setShowFleetPanel(true)}
            onOpenPlanetary={() => setShowPlanetaryPanel(true)}
            totalResearchProjects={getResearchProjectsForFaction(engine.player.faction).length}
            totalFleets={engine.fleets.filter(f => f.owner === 'player').length}
          />

          <div 
            ref={mapContainerRef}
            className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              style={{ 
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
                transformOrigin: '0 0',
              }}
            >
              <Map 
                galaxy={engine.galaxy}
                fleets={engine.fleets}
                playerFaction={engine.player?.faction}
                aiPlayers={engine.aiPlayers}
                selectedPlanet={engine.selectedPlanet}
                selectedFleet={engine.selectedFleet}
                onSelectPlanet={engine.setSelectedPlanet}
                onSelectFleet={(f) => {
                  engine.setSelectedFleet(f);
                }}
                onBackgroundClick={() => {
                  if (!isPanning) {
                    engine.setSelectedPlanet(null);
                    engine.setSelectedFleet(null);
                  }
                }}
                galaxyWidth={engine.GALAXY_WIDTH}
                galaxyHeight={engine.GALAXY_HEIGHT}
              />
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-2 bg-card/80 backdrop-blur-md border border-white/10 rounded-lg p-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleZoom('in')}
              disabled={zoomLevel >= 150}
              data-testid="button-zoom-in"
            >
              <ZoomIn size={18} />
            </Button>
            <div className="text-xs text-center text-muted-foreground px-2 py-1 font-mono">
              {zoomLevel}%
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleZoom('out')}
              disabled={zoomLevel <= 20}
              data-testid="button-zoom-out"
            >
              <ZoomOut size={18} />
            </Button>
            <div className="h-px bg-white/10 my-1" />
            <Button
              size="icon"
              variant="ghost"
              onClick={centerOnHomeworld}
              data-testid="button-center-home"
            >
              <Home size={18} />
            </Button>
          </div>

          <Sidebar 
            selectedPlanet={engine.selectedPlanet}
            selectedFleet={engine.selectedFleet}
            player={engine.player}
            fleets={engine.fleets}
            onBuildShip={engine.buildShip}
            onUpgradeStructure={engine.upgradeStructure}
            onSendFleet={engine.sendFleet}
            onColonize={engine.colonizePlanet}
            onAttackPlanet={engine.attackPlanet}
            onAttackFleet={engine.attackFleet}
            onClose={() => {
              engine.setSelectedPlanet(null);
              engine.setSelectedFleet(null);
            }}
            isShipUnlocked={engine.isShipUnlocked}
          />

          <NotificationFeed notifications={engine.notifications} />
          
          <CombatLog events={engine.combatLog} />

          {engine.showResearchPanel && (
            <ResearchPanel
              player={engine.player}
              research={engine.research}
              maxLabLevel={engine.galaxy.filter(p => p.owner === 'player').reduce((max, p) => Math.max(max, p.structures.researchLab), 0)}
              onStartResearch={engine.startResearch}
              onClose={() => engine.setShowResearchPanel(false)}
            />
          )}

          {showFleetPanel && (
            <FleetPanel
              fleets={engine.fleets}
              player={engine.player}
              galaxy={engine.galaxy}
              onClose={() => setShowFleetPanel(false)}
              onSelectFleet={(fleet) => {
                engine.setSelectedFleet(fleet);
                setShowFleetPanel(false);
              }}
            />
          )}

          {showPlanetaryPanel && (
            <PlanetaryPanel
              planets={engine.galaxy}
              player={engine.player}
              research={engine.research}
              onClose={() => setShowPlanetaryPanel(false)}
            />
          )}
          
          {engine.gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-none">
              <div className="text-4xl font-display font-bold tracking-[0.5em] text-white/50">PAUSED</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
