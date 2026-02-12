import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  colorClass: string;
  subtext?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon, colorClass, subtext }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};