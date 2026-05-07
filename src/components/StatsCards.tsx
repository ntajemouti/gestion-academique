import { StatCard } from '@/lib/index';
import { enrollmentData, performanceData, mockActivities } from '@/data/index';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
};

interface StatsCardsProps {
  stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = iconMap[stat.icon];
        if (!IconComponent) return null;

        return (
          <div
            key={index}
            className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>
                {stat.trend && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {stat.trend}
                  </span>
                )}
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${stat.color} 0%, color-mix(in srgb, ${stat.color} 70%, black) 100%)`,
                }}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Évolution des inscriptions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={enrollmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance par filière</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="filiere" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="moyenne" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ActivitiesTable() {
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'Inscription':
        return 'bg-blue-100 text-blue-800';
      case 'Évaluation':
        return 'bg-green-100 text-green-800';
      case 'Absence':
        return 'bg-red-100 text-red-800';
      case 'Demande':
        return 'bg-yellow-100 text-yellow-800';
      case 'Club':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border mt-6">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Activités récentes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-6 text-sm font-semibold text-foreground">Stagiaire</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-foreground">Filière</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-foreground">Activité</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-foreground">Date</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-foreground">Type</th>
            </tr>
          </thead>
          <tbody>
            {mockActivities.map((activity, index) => (
              <tr
                key={activity.id}
                className={`border-b border-border last:border-0 hover:bg-muted/5 transition-colors ${index % 2 === 0 ? 'bg-muted/5' : ''}`}
              >
                <td className="py-3 px-6 text-sm text-foreground">{activity.stagiaire}</td>
                <td className="py-3 px-6 text-sm text-muted-foreground">{activity.filiere}</td>
                <td className="py-3 px-6 text-sm">
                  <span className="text-primary hover:underline cursor-pointer">{activity.activite}</span>
                </td>
                <td className="py-3 px-6 text-sm text-muted-foreground">
                  {new Date(activity.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-6">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeBadgeColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}