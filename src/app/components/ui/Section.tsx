import React, { ReactNode, forwardRef } from "react";
import { cn } from "../../utils/cn";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, id }, ref) => {
    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          "relative w-full py-20 md:py-32 px-6 md:px-12 max-w-[1440px] mx-auto overflow-hidden",
          className
        )}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = "Section";
