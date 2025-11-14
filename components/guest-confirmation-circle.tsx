"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle, X, Circle, Calendar, MailCheck, Clock } from "lucide-react";
import type { Guest, Organization } from "@/lib/types";

interface GuestConfirmationCircleProps {
  guest: Guest;
  organization: Organization;
  onCycle: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Get the color for a confirmation stage
 * First checks if the stage has a color in config, otherwise uses defaults
 */
function getConfirmationStageColor(
  stageId: string,
  organization: Organization
): string {
  const config = organization.configuration || {};
  const stages = config.confirmationStages?.stages || [];
  const stage = stages.find((s) => s.id === stageId);

  // If stage has a color configured, use it
  if (stage?.color) {
    return stage.color;
  }

  // Fallback to default colors based on stage ID
  switch (stageId) {
    case "listed":
      return "#6B7280"; // gray-500
    case "invited":
      return "#F59E0B"; // yellow-500
    case "confirmed":
    case "confirmed_1":
      return "#22C55E"; // green-500
    case "confirmed_2":
      return "#16A34A"; // green-600
    case "confirmed_3":
      return "#15803D"; // green-700
    case "declined":
      return "#9CA3AF"; // gray-400
    default:
      return "#E5E7EB"; // gray-200 (default)
  }
}

/**
 * Get the label for a confirmation stage
 */
function getConfirmationStageLabel(
  stageId: string,
  organization: Organization
): string {
  const config = organization.configuration || {};
  const stages = config.confirmationStages?.stages || [];
  const stage = stages.find((s) => s.id === stageId);
  return stage?.label || stageId;
}

/**
 * Get the icon for a confirmation stage - each stage gets a unique meaningful icon
 */
function getConfirmationStageIcon(stageId: string, textSize: string = "text-[10px]") {
  // Handle different confirmed stages with tally marks (I, II, III)
  if (stageId === "confirmed_1") {
    return (
      <span className={cn("font-bold leading-none", textSize)}>
        I
      </span>
    );
  }
  if (stageId === "confirmed_2") {
    return (
      <span className={cn("font-bold leading-none", textSize)}>
        II
      </span>
    );
  }
  if (stageId === "confirmed_3") {
    return (
      <span className={cn("font-bold leading-none", textSize)}>
        III
      </span>
    );
  }
  // Generic confirmed stage - CheckCircle icon
  if (stageId.startsWith("confirmed")) {
    return <CheckCircle className="h-3 w-3" />;
  }
  
  switch (stageId) {
    case "invited":
      return <Mail className="h-3 w-3" />;
    case "declined":
      return <X className="h-3 w-3" />;
    case "listed":
      return <Circle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
}

export function GuestConfirmationCircle({
  guest,
  organization,
  onCycle,
  disabled = false,
  size = "md",
  className,
}: GuestConfirmationCircleProps) {
  const stageColor = getConfirmationStageColor(
    guest.confirmation_stage,
    organization
  );
  const stageLabel = getConfirmationStageLabel(
    guest.confirmation_stage,
    organization
  );

  // Size configurations to match color picker
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  // Text sizes for tally marks that match button sizes
  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  // Icon sizes for non-tally icons
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const stageIcon = getConfirmationStageIcon(guest.confirmation_stage, textSizes[size]);
  // Use the stage color directly for the icon
  const iconColor = stageColor;

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCycle();
      }}
      className={cn(
        "transition-all hover:scale-110 cursor-pointer p-0 flex items-center justify-center hover:opacity-80",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span style={{ color: iconColor }}>
        {stageIcon}
      </span>
    </Button>
  );
}

