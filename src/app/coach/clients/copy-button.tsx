"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success("Copied to clipboard");
        } catch {
          toast.error("Couldn't copy. Long-press the link to copy it.");
        }
      }}
    >
      <Copy aria-hidden /> {label}
    </Button>
  );
}
