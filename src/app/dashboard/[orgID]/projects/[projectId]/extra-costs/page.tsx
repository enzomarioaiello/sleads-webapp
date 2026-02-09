"use client";
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
// Removed unused imports
import { Id, Doc } from "../../../../../../../convex/_generated/dataModel";
import { useParams, useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { extraCostsTranslations } from "./extra-costs-translations";
import { InvoiceContextCard } from "./components/InvoiceContextCard";
import { ExtraCostsFilters } from "./components/ExtraCostsFilters";
import { ExtraCostsTable } from "./components/ExtraCostsTable";
import { EmptyState } from "./components/EmptyState";

type ExtraCost = Doc<"extra_costs">;

export default function ProjectExtraCostsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { language } = useApp();
  const invoiceIdParam = searchParams.get("invoiceId");

  // Get translations
  const t =
    extraCostsTranslations[language as "en" | "nl"] ||
    extraCostsTranslations.en;

  // Pagination state
  const [cursor, setCursor] = useState<string | null>(null);
  const [allExtraCosts, setAllExtraCosts] = useState<ExtraCost[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "invoiced" | "uninvoiced" | "voided"
  >("all");
  const [taxFilter, setTaxFilter] = useState<"all" | 0 | 9 | 21>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "separate" | "grouped">(
    "all"
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<
    | "name"
    | "quantity"
    | "pricePerUnit"
    | "subtotal"
    | "total"
    | "createdAt"
    | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch paginated data
  const paginationResult = useQuery(
    api.extraCosts.getExtraCostsForOrganization,
    {
      projectId: projectId as Id<"projects">,
      organizationId: organizationId as Id<"organizations">,
      invoiceId: invoiceIdParam
        ? (invoiceIdParam as Id<"invoices">)
        : undefined,
      paginationOpts: {
        numItems: 50,
        cursor: cursor,
      },
    }
  );

  // Get invoice info if invoiceId is present
  const invoiceInfo = useQuery(
    api.invoice.getInformationForInvoice,
    invoiceIdParam
      ? {
          invoiceId: invoiceIdParam as Id<"invoices">,
        }
      : "skip"
  );

  // Accumulate results when new page loads
  useEffect(() => {
    if (paginationResult?.page) {
      if (cursor === null) {
        // First page - replace
        setTimeout(() => {
          setAllExtraCosts(paginationResult.page);
        }, 0);
      } else {
        // Subsequent pages - append
        setTimeout(() => {
          setAllExtraCosts((prev) => [...prev, ...paginationResult.page]);
        }, 0);
      }
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 0);
    }
  }, [paginationResult?.page, cursor]);

  // Reset when filters or invoiceId change
  useEffect(() => {
    setTimeout(() => {
      setCursor(null);
      setAllExtraCosts([]);
    }, 0);
  }, [invoiceIdParam, projectId, organizationId]);

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          paginationResult &&
          !paginationResult.isDone &&
          !isLoadingMore &&
          paginationResult.continueCursor &&
          cursor !== null // Only auto-load if we've already loaded the first page
        ) {
          setIsLoadingMore(true);
          setCursor(paginationResult.continueCursor);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [paginationResult, isLoadingMore, cursor]);

  // Load more button handler
  const handleLoadMore = useCallback(() => {
    if (
      paginationResult &&
      !paginationResult.isDone &&
      !isLoadingMore &&
      paginationResult.continueCursor
    ) {
      setIsLoadingMore(true);
      setCursor(paginationResult.continueCursor);
    }
  }, [paginationResult, isLoadingMore]);

  // Apply filters
  const filteredExtraCosts = useMemo(() => {
    let filtered = [...allExtraCosts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cost) =>
          cost.name.toLowerCase().includes(query) ||
          cost.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cost) => {
        const isInvoiced =
          cost.invoicedDate !== null || cost.invoiceId !== null;
        const isVoided = cost.voided === true;

        if (statusFilter === "invoiced") return isInvoiced && !isVoided;
        if (statusFilter === "uninvoiced") return !isInvoiced && !isVoided;
        if (statusFilter === "voided") return isVoided;
        return true;
      });
    }

    // Tax filter
    if (taxFilter !== "all") {
      filtered = filtered.filter((cost) => cost.tax === taxFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((cost) => {
        const isSeparate = cost.showSeparatelyOnInvoice === true;
        if (typeFilter === "separate") return isSeparate;
        if (typeFilter === "grouped") return !isSeparate;
        return true;
      });
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter((cost) => {
        const costDate = new Date(cost.createdAt);
        const fromDate = dateRange.from;
        if (!fromDate) return true;

        const toDate = dateRange.to ?? fromDate;

        // Set time to start of day for fromDate
        const fromStart = new Date(fromDate);
        fromStart.setHours(0, 0, 0, 0);

        // Set time to end of day for toDate
        const toEnd = new Date(toDate);
        toEnd.setHours(23, 59, 59, 999);

        return costDate >= fromStart && costDate <= toEnd;
      });
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        switch (sortField) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "quantity":
            aValue = a.amount;
            bValue = b.amount;
            break;
          case "pricePerUnit":
            aValue = a.priceExclTax;
            bValue = b.priceExclTax;
            break;
          case "subtotal":
            aValue = a.amount * a.priceExclTax;
            bValue = b.amount * b.priceExclTax;
            break;
          case "total":
            const aTotal = a.amount * a.priceExclTax * (1 + a.tax / 100);
            const bTotal = b.amount * b.priceExclTax * (1 + b.tax / 100);
            aValue = aTotal;
            bValue = bTotal;
            break;
          case "createdAt":
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          default:
            return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortDirection === "asc"
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        }
      });
    }

    return filtered;
  }, [
    allExtraCosts,
    searchQuery,
    statusFilter,
    taxFilter,
    typeFilter,
    dateRange,
    sortField,
    sortDirection,
  ]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (statusFilter !== "all") count++;
    if (taxFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (dateRange?.from) count++;
    return count;
  }, [searchQuery, statusFilter, taxFilter, typeFilter, dateRange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTaxFilter("all");
    setTypeFilter("all");
    setDateRange(undefined);
    setSortField(null);
    setSortDirection("asc");
  };

  // Handle sorting
  const handleSort = (
    field:
      | "name"
      | "quantity"
      | "pricePerUnit"
      | "subtotal"
      | "total"
      | "createdAt"
  ) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Loading state
  if (paginationResult === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  // Empty state - no extra costs at all
  if (
    paginationResult &&
    paginationResult.page.length === 0 &&
    allExtraCosts.length === 0 &&
    cursor === null
  ) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.page_title}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-sleads-slate400">
            {t.page_description}
          </p>
        </div>

        {invoiceIdParam && invoiceInfo && (
          <InvoiceContextCard
            invoice={invoiceInfo.invoice}
            organizationId={organizationId}
            projectId={projectId}
            t={t}
            language={language as "en" | "nl"}
          />
        )}

        <EmptyState type="no_costs" t={t} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t.page_title}
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-sleads-slate400">
          {t.page_description}
        </p>
      </div>

      {/* Invoice Context Card */}
      {invoiceIdParam && invoiceInfo && (
        <InvoiceContextCard
          invoice={invoiceInfo.invoice}
          organizationId={organizationId}
          projectId={projectId}
          t={t}
          language={language as "en" | "nl"}
        />
      )}

      {/* Filters */}
      <ExtraCostsFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        taxFilter={taxFilter}
        setTaxFilter={setTaxFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        t={t}
      />

      {/* Empty state - filtered results */}
      {filteredExtraCosts.length === 0 && allExtraCosts.length > 0 && (
        <EmptyState
          type="no_filtered_results"
          onClearFilters={clearFilters}
          t={t}
        />
      )}

      {/* Table */}
      {filteredExtraCosts.length > 0 && (
        <ExtraCostsTable
          extraCosts={filteredExtraCosts}
          organizationId={organizationId}
          projectId={projectId}
          t={t}
          language={language as "en" | "nl"}
          paginationResult={paginationResult}
          isLoadingMore={isLoadingMore}
          observerTarget={observerTarget}
          handleLoadMore={handleLoadMore}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
