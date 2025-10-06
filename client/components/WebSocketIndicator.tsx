import React from 'react';
import { Wifi, WifiOff, AlertCircle, Activity } from 'lucide-react';
import { useConnectionStatus, useWebSocketMetrics } from '../stores/websocketStoreSimple';

const WebSocketIndicator: React.FC = () => {
  const { isConnected, connectionQuality, latency } = useConnectionStatus();
  const { errors, reconnectAttempts } = useWebSocketMetrics();
  const [showDetails, setShowDetails] = React.useState(false);

  // Determine icon and color based on connection quality
  const getIndicatorProps = () => {
    if (!isConnected) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        label: 'Disconnected',
        pulse: false
      };
    }

    switch (connectionQuality) {
      case 'excellent':
        return {
          icon: Wifi,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          label: 'Excellent',
          pulse: false
        };
      case 'good':
        return {
          icon: Wifi,
          color: 'text-green-400',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Good',
          pulse: false
        };
      case 'fair':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300',
          label: 'Fair',
          pulse: true
        };
      case 'poor':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300',
          label: 'Poor',
          pulse: true
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          label: 'Unknown',
          pulse: false
        };
    }
  };

  const { icon: Icon, color, bgColor, borderColor, label, pulse } = getIndicatorProps();

  return (
    <div className="relative">
      {/* Main Indicator Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all
          ${bgColor} ${borderColor} hover:shadow-md
          ${pulse ? 'animate-pulse' : ''}
        `}
        title={`Connection: ${label} (${latency}ms)`}
      >
        <Icon className={`h-4 w-4 ${color}`} />
        <span className={`text-xs font-medium ${color}`}>
          {latency > 0 ? `${latency}ms` : label}
        </span>
      </button>

      {/* Detailed Popup */}
      {showDetails && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Connection Status
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-medium text-gray-900">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Connection Quality */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Quality</span>
                <span className={`text-xs font-medium ${color}`}>
                  {label}
                </span>
              </div>

              {/* Latency */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Latency</span>
                <span className="text-xs font-medium text-gray-900">
                  {latency > 0 ? `${latency}ms` : 'N/A'}
                </span>
              </div>

              {/* Reconnect Attempts */}
              {reconnectAttempts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Reconnect Attempts</span>
                  <span className="text-xs font-medium text-orange-600">
                    {reconnectAttempts}
                  </span>
                </div>
              )}

              {/* Errors */}
              {errors > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Errors</span>
                  <span className="text-xs font-medium text-red-600">
                    {errors}
                  </span>
                </div>
              )}

              {/* Latency Graph */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Latency Range</span>
                  <Activity className="h-3 w-3 text-gray-400" />
                </div>
                <div className="flex items-end gap-1 h-8">
                  {[...Array(10)].map((_, i) => {
                    const height = Math.random() * 100;
                    const barColor = 
                      height < 30 ? 'bg-green-400' :
                      height < 60 ? 'bg-yellow-400' :
                      height < 80 ? 'bg-orange-400' : 'bg-red-400';
                    
                    return (
                      <div
                        key={i}
                        className={`flex-1 ${barColor} rounded-t opacity-75`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">0ms</span>
                  <span className="text-xs text-gray-400">500ms</span>
                </div>
              </div>

              {/* Connection Tips */}
              {connectionQuality === 'poor' && (
                <div className="mt-3 p-2 bg-orange-50 rounded">
                  <p className="text-xs text-orange-800">
                    <strong>Tip:</strong> Poor connection detected. Try refreshing the page or check your internet connection.
                  </p>
                </div>
              )}

              {!isConnected && (
                <div className="mt-3 p-2 bg-red-50 rounded">
                  <p className="text-xs text-red-800">
                    <strong>Warning:</strong> Real-time updates are disabled. Reconnecting...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketIndicator;
