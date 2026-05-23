import { BadgeCheck } from "lucide-react";

type Props = {
  verified?: boolean;
  size?: number;
};

export function VerifiedBadge({ verified, size = 16 }: Props) {
  if (!verified) return null;
  return (
    <span className="inline-flex shrink-0 items-center text-[#007aff] dark:text-[#64d2ff]" title="Verified" aria-label="Verified account">
      <BadgeCheck size={size} strokeWidth={2.4} />
    </span>
  );
}
