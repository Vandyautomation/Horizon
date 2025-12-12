"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import SalesOrderDetailPlanner from "@/components/sales-order-detail-planner";

export default function SalesOrderDetailPage() {
  const searchParams = useSearchParams();
  const so = searchParams.get("so") || "";
  const customer = searchParams.get("customer") || "";
  const itemNo = searchParams.get("itemNo") || "";
  const description = searchParams.get("description") || "";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Sales Order Detail</h1>
      </div>

      {/* Planning Component */}
      <SalesOrderDetailPlanner so={so} customer={customer} itemNo={itemNo} description={description} />
    </div>
  );
}
