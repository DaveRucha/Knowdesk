"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

interface DailyData {
  date: string;
  questions: number;
  answered: number;
  gaps: number;
}

interface TopQuestion {
  question: string;
  count: number;
}

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  dailyData: DailyData[];
  topQuestionsData: TopQuestion[];
  donutData: DonutSlice[];
}

export function AnalyticsCharts({ dailyData, topQuestionsData, donutData }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-sm font-semibold text-slate-900 mb-1">Questions over time</div>
        <div className="text-xs text-slate-400 mb-5">Last 7 days</div>
        {dailyData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-slate-400">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="questions" stroke="#6366f1" strokeWidth={2} fill="url(#colorQ)" name="Questions" />
              <Area type="monotone" dataKey="answered" stroke="#10b981" strokeWidth={2} fill="none" name="Answered" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-sm font-semibold text-slate-900 mb-1">Answer breakdown</div>
        <div className="text-xs text-slate-400 mb-5">All time</div>
        {donutData.every(d => d.value === 0) ? (
          <div className="h-40 flex items-center justify-center text-sm text-slate-400">No data yet</div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-sm font-semibold text-slate-900 mb-1">Most asked questions</div>
        <div className="text-xs text-slate-400 mb-5">Top 5 by frequency</div>
        {topQuestionsData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-slate-400">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topQuestionsData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="question" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={220} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Times asked" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
