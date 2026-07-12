"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ActionAlertDialog from "@/components/ActionAlertDialog";

type ActionErrorFromUrlProps = {
  message: string | null;
  photographerId: number;
  loginHash: string;
};

export default function ActionErrorFromUrl({
  message,
  photographerId,
  loginHash,
}: ActionErrorFromUrlProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!message || dismissed) return;

    const params = new URLSearchParams({ loginHash });
    router.replace(`/photographers/${photographerId}?${params.toString()}`, {
      scroll: false,
    });
  }, [message, dismissed, photographerId, loginHash, router]);

  if (!message || dismissed) {
    return null;
  }

  return (
    <ActionAlertDialog message={message} onClose={() => setDismissed(true)} />
  );
}
