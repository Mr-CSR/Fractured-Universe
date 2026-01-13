import { type Notification } from "@/hooks/use-game-engine";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface NotificationFeedProps {
  notifications: Notification[];
}

const NOTIFICATION_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle
};

export function NotificationFeed({ notifications }: NotificationFeedProps) {
  return (
    <div className="absolute bottom-6 left-6 w-80 z-30 pointer-events-none">
      <div className="flex flex-col-reverse gap-2">
        {notifications.map((n, idx) => {
          const Icon = NOTIFICATION_ICONS[n.type];
          return (
            <div
              key={n.id}
              className={`
                relative overflow-hidden p-3 rounded-lg border-l-4 shadow-lg backdrop-blur-md
                animate-in fade-in slide-in-from-left-8 duration-500
                ${n.type === 'success' ? 'bg-green-950/90 border-green-500 text-green-200' : ''}
                ${n.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-200' : ''}
                ${n.type === 'info' ? 'bg-slate-950/90 border-blue-500 text-blue-200' : ''}
                ${n.type === 'warning' ? 'bg-yellow-950/90 border-yellow-500 text-yellow-200' : ''}
              `}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Shimmer effect for new notifications */}
              {idx === 0 && (
                <div className="absolute inset-0 animate-shimmer opacity-20" />
              )}
              <div className="flex items-start gap-2 relative z-10">
                <Icon size={14} className={`flex-shrink-0 mt-0.5 ${idx === 0 ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-mono leading-relaxed">{n.message}</span>
              </div>
              {/* Glow effect */}
              <div 
                className={`absolute -inset-1 blur-xl opacity-20 ${
                  n.type === 'success' ? 'bg-green-500' : 
                  n.type === 'error' ? 'bg-red-500' : 
                  n.type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
