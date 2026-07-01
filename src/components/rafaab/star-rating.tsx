import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 14,
  className,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              i < rounded ? "text-amber-400 fill-amber-400" : "text-muted-foreground/25 fill-muted-foreground/20"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="ml-1 text-xs font-semibold text-foreground/80">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="ml-1 text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
