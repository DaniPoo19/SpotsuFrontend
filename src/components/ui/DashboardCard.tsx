import React from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  disabled?: boolean;
  required?: boolean;
  onClick: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  description, 
  icon: Icon,
  path,
  disabled = false,
  required = false,
  onClick
}) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-lg bg-[#006837]/10">
          <Icon className="w-6 h-6 text-[#006837]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
      {required && (
        <div className="mt-4">
          <span className="inline-block px-3 py-1 text-sm font-medium text-[#006837] bg-[#006837]/10 rounded-full">
            Requerido
          </span>
        </div>
      )}
    </div>
  );
}; 