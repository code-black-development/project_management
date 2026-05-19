"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLinkIcon } from "lucide-react";

const BillingPortalButton = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-x-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ExternalLinkIcon className="size-3.5" />
      {loading ? "Opening..." : "Manage billing"}
    </button>
  );
};

export default BillingPortalButton;
