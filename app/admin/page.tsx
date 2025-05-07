"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Calculator, Clock, Database, Lightbulb, SprayCan, Zap } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function AdminUI() {
  const [user, setUser] = useState('');
  useEffect(() => {
    // Retrieve user data from local storage
    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('user') || '';
      if (userData) {
        setUser(userData);
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col space-y-8 p-8 md:flex">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome {user}!</h2>
        <h3>
          Which menu do you want to go?{' '}
          <Link href="/login" passHref legacyBehavior>
            <a className="text-blue-500 hover:text-blue-700">
              <em>{user ? null : '(login to get more access)'}</em>
            </a>
          </Link>
        </h3>
        <div className="grid grid-cols-7 py-4 gap-4">
          <Link href="/countboard" passHref legacyBehavior>
            <a className="w-full">
              <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                <CardContent className="text-center pt-6">
                  <Label
                    style={{
                      cursor: 'pointer',
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                    }}
                    className="flex items-center justify-center gap-4"
                  >
                    <Calculator />
                    Countboard
                  </Label>
                </CardContent>
              </Card>
            </a>
          </Link>

          <Link href="/countboard/uv" passHref legacyBehavior>
            <a className="w-full">
              <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                <CardContent className="text-center pt-6">
                  <Label
                    style={{
                      cursor: 'pointer',
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                    }}
                    className="flex items-center justify-center gap-4"
                  >
                    <SprayCan />
                    Countboard UV
                  </Label>
                </CardContent>
              </Card>
            </a>
          </Link>

          <Link href="/ems" passHref legacyBehavior>
            <a className="w-full">
              <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                <CardContent className="text-center pt-6">
                  <Label
                    style={{
                      cursor: 'pointer',
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                    }}
                    className="flex items-center justify-center gap-4"
                  >
                    <Zap />
                    Energy Monitoring
                  </Label>
                </CardContent>
              </Card>
            </a>
          </Link>

          <Link href="/andon" passHref legacyBehavior>
            <a className="w-full">
              <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                <CardContent className="text-center pt-6">
                  <Label
                    style={{
                      cursor: 'pointer',
                      fontFamily: 'sans-serif',
                      fontWeight: 'bold',
                    }}
                    className="flex items-center justify-center gap-4"
                  >
                    <Lightbulb />
                    Andon
                  </Label>
                </CardContent>
              </Card>
            </a>
          </Link>


            <Link href="/qco" passHref legacyBehavior>
              <a className="w-full">
                <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                  <CardContent className="text-center pt-6">
                    <Label
                      style={{
                        cursor: 'pointer',
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold',
                      }}
                      className="flex items-center justify-center gap-4"
                    >
                      <Clock />
                      SMED
                    </Label>
                  </CardContent>
                </Card>
              </a>
            </Link>


          <a
            href="http://dmksrv02:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
              <CardContent className="text-center pt-4 pb-4">
                <div>
                  <Image
                    src="/admin/logo-grafana-new2.png"
                    alt="grafana"
                    width={100}
                    height={50}
                    className="flex items-center justify-center"
                  />
                </div>
              </CardContent>
            </Card>
          </a>

          {!user ? null : (
            <Link href="/master-data" passHref legacyBehavior>
              <a className="w-full">
                <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                  <CardContent className="text-center pt-6">
                    <Label
                      style={{
                        cursor: 'pointer',
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold',
                      }}
                      className="flex items-center justify-center gap-4"
                    >
                      <Database />
                      Master Data
                    </Label>
                  </CardContent>
                </Card>
              </a>
            </Link>
          )}

          {!user ? null : (
            <Link href="/machines" passHref legacyBehavior>
              <a className="w-full">
                <Card className="flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer h-full">
                  <CardContent className="text-center pt-6">
                    <Label
                      style={{
                        cursor: 'pointer',
                        fontFamily: 'sans-serif',
                        fontWeight: 'bold',
                      }}
                      className="flex items-center justify-center gap-4"
                    >
                      <Bot />
                      Machines
                    </Label>
                  </CardContent>
                </Card>
              </a>
            </Link>
          )}

          
        </div>
      </div>
      <a
        href="https://dzulfikar.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground pt-2 fixed bottom-4 left-1/2 transform -translate-x-1/2 cursor-pointer"
      >
        developed by <strong>Albea IT</strong>
      </a>
    </div>
  );
}