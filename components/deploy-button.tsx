"use client"

import { Button } from "@/components/ui/button";

type DeployButtonProps = {
  loading: boolean;
  onDeploy: () => void;
};

export default function DeployButton({ loading, onDeploy }: DeployButtonProps) {
  return (
    <Button onClick={onDeploy} disabled={loading}>
      {loading ? "Deploying..." : "Deploy OTA Firmware"}
    </Button>
  );
}
