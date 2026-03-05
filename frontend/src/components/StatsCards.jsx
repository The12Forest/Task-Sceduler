const StatsCards = ({ stats }) => {
  const cards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      color: 'text-primary-400',
      bg: 'bg-primary-600/10',
      border: 'border-primary-600/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Completed',
      value: stats.completed,
      color: 'text-green-400',
      bg: 'bg-green-600/10',
      border: 'border-green-600/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      label: 'Due / Overdue',
      value: stats.dueToday,
      color: stats.dueToday > 0 ? 'text-red-400' : 'text-yellow-400',
      bg: stats.dueToday > 0 ? 'bg-red-600/10' : 'bg-yellow-600/10',
      border: stats.dueToday > 0 ? 'border-red-600/30' : 'border-yellow-600/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} ${card.border} border rounded-xl p-3 sm:p-5 transition-all duration-300 hover:scale-[1.02]`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-1">
            <div>
              <p className="text-xs sm:text-sm text-gray-400">{card.label}</p>
              <p className={`text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1 ${card.color}`}>{card.value}</p>
            </div>
            <div className={`${card.color} opacity-50 hidden sm:block`}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
