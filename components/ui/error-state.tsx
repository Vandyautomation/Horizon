import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

interface ErrorStateProps {
  title?: string
  message: string
}

export default function ErrorState({ title = "Error", message }: ErrorStateProps) {
  return (
    <Card className="w-full max-w-md mx-auto mt-2">
      <CardContent className="pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}