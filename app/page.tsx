import { BusyDashboard } from "./components/BusyDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "howbusy.is/nyc",
  description: "How busy is NYC right now? Real data, no fluff.",
  openGraph: {
    title: "howbusy.is/nyc",
    description: "How busy is NYC right now?",
    images: ["/og?score=50"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "howbusy.is/nyc",
    description: "How busy is NYC right now?",
    images: ["/og?score=50"],
  },
};

export default function Home() {
  return <BusyDashboard />;
}
