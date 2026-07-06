'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_CONFIG, PIPELINE_STATUSES, type ApplicationStatus } from '@/lib/constants';

interface StatusChartProps {
  byStatus: Record<ApplicationStatus, number>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { status: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{label || payload[0].payload.status}</p>
      <p className="text-sm font-semibold text-foreground">{payload[0].value} application{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export function StatusCharts({ byStatus }: StatusChartProps) {
  const chartData = PIPELINE_STATUSES.map((status) => ({
    status,
    count: byStatus[status] || 0,
    fill: STATUS_CONFIG[status].chart,
  })).filter((d) => d.count > 0);

  const closedData = (['Rejected', 'No Response', 'Withdrawn'] as ApplicationStatus[])
    .map((status) => ({
      status,
      count: byStatus[status] || 0,
      fill: STATUS_CONFIG[status].chart,
    }))
    .filter((d) => d.count > 0);

  const total = chartData.reduce((s, d) => s + d.count, 0);

  if (total === 0 && closedData.length === 0) {
    return (
      <Card className="surface-card">
        <CardContent className="py-16 text-center text-muted-foreground">
          No applications yet. Add your first application to see pipeline analytics.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="surface-card">
        <CardHeader className="pb-1 pt-6 px-6">
          <CardTitle className="text-base font-semibold">Active Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 12, right: 12, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 10% 90%)" vertical={false} />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 11, fill: 'hsl(24 6% 46%)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(24 6% 46%)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="pb-1 pt-6 px-6">
          <CardTitle className="text-base font-semibold">Pipeline Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-6">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={[...chartData, ...closedData]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
                stroke="none"
              >
                {[...chartData, ...closedData].map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {[...chartData, ...closedData].map((d) => (
              <div key={d.status} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                <span>{d.status}</span>
                <span className="font-medium text-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
