import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingStateProps {
  message?: string
}

export default function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <Card className="w-full max-w-md mx-auto mt-2">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}