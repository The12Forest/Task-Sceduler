import { useOnlineStatus } from '../hooks/useOnlineStatus';

const StatusIndicator = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]'
        }`}
      />
      <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
        {isOnline ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};

export default StatusIndicator;
