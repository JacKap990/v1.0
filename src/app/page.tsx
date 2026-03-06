export const runtime = 'edge';
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardFromPage from "./dashboard/page";

export default function Home() {
    return <DashboardFromPage />;
}
