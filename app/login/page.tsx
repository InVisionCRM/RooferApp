"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 10
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
    setPhone(digits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (phone.length < 10) {
        setError("Please enter a valid 10-digit phone number")
        setIsLoading(false)
        return
      }

      const result = await signIn("phone", {
        phone: phone,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error === "CredentialsSignin" 
          ? "No active photo assignments found for this phone number. Please contact your supervisor."
          : "Authentication failed. Please try again.")
      } else if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-[#a4c639] p-4 rounded-full">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Roofer Camera App</CardTitle>
          <CardDescription>
            Enter your phone number to access your assigned photo jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="5551234567"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                disabled={isLoading}
                className="text-lg"
                autoComplete="tel"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter 10-digit phone number (digits only)
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#a4c639] hover:bg-[#8aaa2a] text-white"
              size="lg"
              disabled={isLoading || phone.length < 10}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact your supervisor</p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom branding */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        Powered by In Vision Property Management
      </div>
    </div>
  )
}

