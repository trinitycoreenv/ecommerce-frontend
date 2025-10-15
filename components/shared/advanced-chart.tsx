"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTheme } from "next-themes"

interface ChartDataPoint {
  name: string
  value?: number
  [key: string]: string | number | undefined
}

interface MultiSeriesConfig {
  dataKey: string
  color: string
  name: string
}

interface AdvancedChartProps {
  title: string
  description?: string
  data: ChartDataPoint[]
  type?: "line" | "bar" | "area" | "pie"
  dataKey?: string
  nameKey?: string
  className?: string
  multiSeries?: MultiSeriesConfig[]
  showGrid?: boolean
  showLegend?: boolean
}

// Elegant color palette: white-rich for dark theme, black-rich for light theme
const getThemeColors = (isDark: boolean) => [
  isDark ? "#ffffff" : "#000000", // Pure white/black
  isDark ? "#f8f9fa" : "#1a1a1a", // Off-white/charcoal
  isDark ? "#e9ecef" : "#2d2d2d", // Light gray/dark gray
  isDark ? "#dee2e6" : "#404040", // Medium light gray/medium dark gray
  isDark ? "#ced4da" : "#525252", // Gray/darker gray
]

export function AdvancedChart({
  title,
  description,
  data,
  type = "line",
  dataKey = "value",
  nameKey = "name",
  className,
  multiSeries,
  showGrid = true,
  showLegend = false,
}: AdvancedChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const themeColors = getThemeColors(isDark)
  
  // Debug: Log the colors being used
  console.log('Chart colors:', { theme, isDark, themeColors })
  
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
        <CardTitle className="text-sm md:text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs md:text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer 
          key={`chart-${theme}-${isDark}`} 
          config={chartConfig} 
          className="h-[250px] md:h-[300px] lg:h-[350px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data}>
                {showGrid && (
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} 
                    opacity={0.3} 
                  />
                )}
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 10
                  }}
                />
                <YAxis
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 10
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
                {showLegend && <Legend />}
                {multiSeries ? (
                  multiSeries.map((series, index) => (
                    <Line
                      key={series.dataKey}
                      type="monotone"
                      dataKey={series.dataKey}
                      stroke={themeColors[index % themeColors.length]}
                      strokeWidth={3}
                      dot={{ 
                        fill: themeColors[index % themeColors.length], 
                        r: 5, 
                        strokeWidth: 2, 
                        stroke: isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)" 
                      }}
                      activeDot={{ r: 7 }}
                      name={series.name}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={themeColors[0]}
                    strokeWidth={3}
                    dot={{ 
                      fill: themeColors[0], 
                      r: 5, 
                      strokeWidth: 2, 
                      stroke: isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)" 
                    }}
                    activeDot={{ r: 7 }}
                  />
                )}
              </LineChart>
            ) : type === "area" ? (
              <AreaChart data={data}>
                {showGrid && (
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} 
                    opacity={0.3} 
                  />
                )}
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 10
                  }}
                />
                <YAxis
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 10
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
                {showLegend && <Legend />}
                {multiSeries ? (
                  multiSeries.map((series, index) => (
                    <Area
                      key={series.dataKey}
                      type="monotone"
                      dataKey={series.dataKey}
                      stroke={themeColors[index % themeColors.length]}
                      fill={themeColors[index % themeColors.length]}
                      fillOpacity={0.3}
                      strokeWidth={2.5}
                      name={series.name}
                    />
                  ))
                ) : (
                  <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={themeColors[0]}
                    fill={themeColors[0]}
                    fillOpacity={0.3}
                    strokeWidth={2.5}
                  />
                )}
              </AreaChart>
            ) : type === "pie" ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ [nameKey]: name, percent }: any) => (
                    <text 
                      x={0} 
                      y={0} 
                      textAnchor="middle" 
                      dominantBaseline="central"
                      fill={isDark ? "white" : "black"}
                      fontSize={10}
                      fontWeight="500"
                    >
                      {`${name}: ${((percent as number) * 100).toFixed(0)}%`}
                    </text>
                  )}
                  outerRadius={80}
                  fill={themeColors[0]}
                  dataKey={dataKey}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={themeColors[index % themeColors.length]}
                      style={{ fill: themeColors[index % themeColors.length] }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    color: isDark ? "white" : "black"
                  }}
                />
              </PieChart>
            ) : (
              <BarChart data={data}>
                {showGrid && (
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"} 
                    opacity={0.3} 
                  />
                )}
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 10
                  }}
                />
                <YAxis
                  className="text-xs"
                  stroke={isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"}
                  tick={{ 
                    fill: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                    fontSize: 10
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
                {showLegend && <Legend />}
                {multiSeries ? (
                  multiSeries.map((series, index) => (
                    <Bar 
                      key={series.dataKey} 
                      dataKey={series.dataKey} 
                      fill={themeColors[index % themeColors.length]} 
                      radius={[8, 8, 0, 0]}
                      style={{ fill: themeColors[index % themeColors.length] }}
                    />
                  ))
                ) : (
                  <Bar 
                    dataKey={dataKey} 
                    fill={themeColors[0]} 
                    radius={[8, 8, 0, 0]}
                    style={{ fill: themeColors[0] }}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

