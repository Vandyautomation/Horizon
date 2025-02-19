"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter()

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log(data)

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Handle successful login
      // Store token, redirect, etc.
      document.cookie = `authToken=${data.data.token}; Path=/; SameSite=Strict; Secure;`;
      if (typeof window !== 'undefined' && window.localStorage) {
        // Access localStorage here
        localStorage.setItem('user', data.data.UserName);

      }
      window.dispatchEvent(new CustomEvent("storage"))


      // Redirect to the next page
      toast.success('Login successful!');

      router.push('/')
    } catch (err) {
      setError((err as Error).message);
      console.log((err as Error).message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your NIK below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="username">NIK</Label>
            <Input
              id="username"
              type="text"
              placeholder="NIK"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              {/* <Link href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link> */}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        {/* <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="#" className="underline">
            Sign up
          </Link>
        </div> */}
      </CardContent>
    </Card>
  );
}
