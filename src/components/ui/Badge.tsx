// Compat shim — re-export Pill as Badge to keep older imports working
// during the visual rebuild.
import Pill, { type PillVariant } from "./Pill";

const STATUS_TO_VARIANT: Record<string, PillVariant> = {
  Completed: "ok",
  Processing: "info",
  Pending: "neutral",
  Default: "neutral",
};

const Badge = ({
  label,
  variant,
}: {
  label: string;
  variant?: string;
  size?: "sm" | "md";
}) => (
  <Pill variant={STATUS_TO_VARIANT[variant ?? "Default"] ?? "neutral"}>
    {label}
  </Pill>
);

export default Badge;
