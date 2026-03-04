import { useAuth } from '../context/AuthContext';

const ImpersonationBanner = () => {
  const { user, isImpersonating, stopImpersonation } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="bg-yellow-600/90 text-yellow-50 px-4 py-2 text-sm flex items-center justify-between gap-3 z-50">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>
          Impersonating <strong>{user?.name}</strong> ({user?.email})
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        className="px-3 py-1 bg-yellow-800 hover:bg-yellow-900 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
      >
        Return to Admin
      </button>
    </div>
  );
};

export default ImpersonationBanner;
