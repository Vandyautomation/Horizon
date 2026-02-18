"use client";

import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeft } from "lucide-react";

interface Machine {
  MchID: string;
  MchDesc: string;
  MchNumber: string;
  MchLoc: string;
  Tonage: string;
  status: string;
  timestamp: string;
}

const statusLabels: Record<string, string> = {
  GREEN: "Running",
  WHITE: "Planned Stop",
  BLUE: "Changeover",
  ORANGE: "Breakdown",
  RED: "Non Quality",
  PURPLE: "Org Dysfunction",
  YELLOW: "Micro Stop",
  GREY: "Unclassified",
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AndonStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status") || "";
  const location = searchParams.get("location") || "";

  const { data, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/andon/buildings/injection`,
    fetcher
  );

  const machines: Machine[] =
    data
      ?.flatMap((building: any) => building.machines)
      ?.filter((m: Machine) => {
        if (status && m.status !== status) return false;
        if (location && m.MchLoc !== location) return false;
        return true;
      }) || [];

  if (!status) {
    return (
      <div className="p-6">
        <p className="text-red-500 font-semibold">
          Status parameter not found.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {location
                ? `${location} - ${statusLabels[status] || status}`
                : `All Buildings - ${statusLabels[status] || status}`}
              {" "}({machines.length} machines)
            </CardTitle>

            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Loading machines...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Mch Number</TableHead>
                  <TableHead>Mch Loc</TableHead>
                  <TableHead>Mch Tonage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Status Changed</TableHead>
                  <TableHead>Countboard</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {machines.map((machine) => (
                  <TableRow key={machine.MchID}>
                    <TableCell>{machine.MchDesc}</TableCell>
                    <TableCell>{machine.MchNumber}</TableCell>
                    <TableCell>{machine.MchLoc}</TableCell>
                    <TableCell>{machine.Tonage}</TableCell>
                    <TableCell>
                      {statusLabels[machine.status] || machine.status}
                    </TableCell>
                    <TableCell>
                      {machine.timestamp
                        ? new Date(machine.timestamp).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() =>
                          window.open(
                            `/admin/countboard/?machineNumber=${machine.MchNumber}&location=${machine.MchLoc}`,
                            "_blank"
                          )
                        }
                      >
                        <Calculator size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {machines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No machines found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
