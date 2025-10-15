"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTheme } from "next-themes"

interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

interface MultiSeriesConfig {
  dataKey: string
  color: string
  name: string
}

interface StatChartProps {
  title: string
  description?: string
  data: ChartDataPoint[]
  type?: "line" | "bar"
  dataKey?: string
  className?: string
  multiSeries?: MultiSeriesConfig[]
}

// Elegant color palette: white-rich for dark theme, black-rich for light theme
const getThemeColors = (isDark: boolean) => [
  isDark ? "#ffffff" : "#000000", // Pure white/black
  isDark ? "#f8f9fa" : "#1a1a1a", // Off-white/charcoal
  isDark ? "#e9ecef" : "#2d2d2d", // Light gray/dark gray
  isDark ? "#dee2e6" : "#404040", // Medium light gray/medium dark gray
  isDark ? "#ced4da" : "#525252", // Gray/darker gray
]

export function StatChart({
  title,
  description,
  data,
  type = "line",
  dataKey = "value",
  className,
  multiSeries,
}: StatChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const themeColors = getThemeColors(isDark)
  
  const chartConfig = multiSeries
    ? Object.fromEntries(
        multiSeries.map((series, index) => [
          series.dataKey,
          {
            label: series.name,
            color: themeColors[index % themeColors.length], // Always use our elegant colors
          },
        ]),
      )
    : {
        [dataKey]: {
          label: title,
          color: themeColors[0],
        },
      }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer 
          key={`chart-${theme}-${isDark}`} 
          config={chartConfig} 
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} 
                  opacity={0.3} 
                />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 12
                  }}
                />
                <YAxis
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 12
                  }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  contentStyle={{
                    backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    color: isDark ? "white" : "black"
                  }}
                />
                {multiSeries && <Legend />}
                {multiSeries ? (
                  multiSeries.map((series, index) => (
                    <Line
                      key={series.dataKey}
                      type="monotone"
                      dataKey={series.dataKey}
                      stroke={themeColors[index % themeColors.length]}
                      strokeWidth={2.5}
                      dot={{ 
                        fill: themeColors[index % themeColors.length], 
                        r: 4,
                        strokeWidth: 2,
                        stroke: isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)"
                      }}
                      activeDot={{ r: 6 }}
                      name={series.name}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={themeColors[0]}
                    strokeWidth={2.5}
                    dot={{ 
                      fill: themeColors[0], 
                      r: 4,
                      strokeWidth: 2,
                      stroke: isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)"
                    }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} 
                  opacity={0.3} 
                />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 12
                  }}
                />
                <YAxis
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 12
                  }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  contentStyle={{
                    backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    color: isDark ? "white" : "black"
                  }}
                />
                <Bar 
                  dataKey={dataKey} 
                  fill={themeColors[0]} 
                  radius={[6, 6, 0, 0]}
                  style={{ fill: themeColors[0] }}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
