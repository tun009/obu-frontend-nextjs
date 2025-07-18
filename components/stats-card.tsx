import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  trend: "up" | "down" | "neutral"
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className={`flex items-center text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {description}
        </div>
      </CardContent>
    </Card>
  )
}
