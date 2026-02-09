"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { dictionary } from "../../locales/dictionary";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Building2,
  Globe,
  HandCoins,
  Landmark,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import "./pdf.css";

// Page dimension constants (A4: 210mm × 297mm)
const PAGE_HEIGHT_MM = 297;
const PAGE_PADDING_MM = 20;
const PAGE_NUMBER_HEIGHT_MM = 8; // Space reserved for page number at bottom

// Convert mm to pixels (approximate: 1mm ≈ 3.7795px at 96 DPI)
const MM_TO_PX = 3.7795;

const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX;
const PAGE_PADDING_PX = PAGE_PADDING_MM * MM_TO_PX;
const PAGE_NUMBER_HEIGHT_PX = PAGE_NUMBER_HEIGHT_MM * MM_TO_PX;

interface DocumentPreviewProps {
  quoteId?: Id<"quotes"> | null;
  invoiceId?: Id<"invoices"> | null;
  type: "quote" | "invoice";
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  quoteId,
  invoiceId,
  type,
}) => {
  const quoteInformation = useQuery(
    api.quote.getInformationForQuote,
    type === "quote" && quoteId
      ? {
          quoteId: quoteId,
        }
      : "skip"
  );

  const invoiceInformation = useQuery(
    api.invoice.getInformationForInvoice,
    type === "invoice" && invoiceId
      ? {
          invoiceId: invoiceId,
        }
      : "skip"
  );

  // Measurement refs
  const measurementContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const totalsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const itemRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // Measured heights state
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [tableHeaderHeight, setTableHeaderHeight] = useState<number>(0);
  const [totalsHeight, setTotalsHeight] = useState<number>(0);
  const [footerHeight, setFooterHeight] = useState<number>(0);
  const [isMeasuring, setIsMeasuring] = useState(true);

  // Memoize items to avoid dependency issues
  const items = useMemo(() => {
    if (type === "quote" && quoteInformation) {
      return quoteInformation.quote.quoteItems || [];
    }
    if (type === "invoice" && invoiceInformation) {
      return invoiceInformation.invoice.invoiceItems || [];
    }
    return [];
  }, [type, quoteInformation, invoiceInformation]);

  type ItemType = (typeof items)[0];

  // Calculate totals
  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc: number, item: ItemType) =>
          acc + item.quantity * item.priceExclTax,
        0
      ),
    [items]
  );
  const totalTax = useMemo(
    () =>
      items.reduce(
        (acc: number, item: ItemType) =>
          acc + item.quantity * item.priceExclTax * (item.tax / 100),
        0
      ),
    [items]
  );
  const total = subtotal + totalTax;

  // Get document data (safe to use after hooks)
  const doc =
    type === "quote" && quoteInformation
      ? quoteInformation.quote
      : type === "invoice" && invoiceInformation
        ? invoiceInformation.invoice
        : null;
  const project =
    type === "quote" && quoteInformation
      ? quoteInformation.project
      : type === "invoice" && invoiceInformation
        ? invoiceInformation.project
        : null;
  const contactInfo =
    type === "quote" && quoteInformation
      ? quoteInformation.contactInfo
      : type === "invoice" && invoiceInformation
        ? invoiceInformation.contactInfo
        : null;

  const t = doc ? dictionary[doc.language as "en" | "nl"] : dictionary.en;

  // Measure item row heights
  useEffect(() => {
    // Reset refs array when items change
    itemRowRefs.current = new Array(items.length).fill(null);

    if (items.length === 0) {
      // Use setTimeout to avoid synchronous setState
      const timeoutId = setTimeout(() => {
        setItemHeights([]);
        setIsMeasuring(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    // Don't start measuring if doc is not available yet (measurement container won't render)
    if (!doc) {
      setIsMeasuring(false);
      return;
    }

    // Use setTimeout to avoid synchronous setState
    const initTimeoutId = setTimeout(() => {
      setIsMeasuring(true);
    }, 0);

    let measurementAttempts = 0;
    const maxAttempts = 10; // Maximum attempts before giving up
    let retryTimeoutId: NodeJS.Timeout | null = null;

    const attemptMeasurement = () => {
      measurementAttempts++;
      const heights: number[] = [];

      itemRowRefs.current.forEach((ref) => {
        if (ref) {
          const height = ref.getBoundingClientRect().height;
          if (height > 0) {
            heights.push(height);
          }
        }
      });

      // If we got all heights, we're done
      if (heights.length === items.length && heights.length > 0) {
        setItemHeights(heights);
        setIsMeasuring(false);
        return;
      }

      // If we haven't reached max attempts and still missing refs, try again
      if (measurementAttempts < maxAttempts) {
        retryTimeoutId = setTimeout(attemptMeasurement, 100);
      } else {
        // Fallback: use estimated heights if measurement fails
        console.warn("Failed to measure all item heights, using fallback");
        const fallbackHeights = new Array(items.length).fill(50); // 50px fallback
        setItemHeights(fallbackHeights);
        setIsMeasuring(false);
      }
    };

    // Start measurement after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(attemptMeasurement, 150);

    return () => {
      clearTimeout(initTimeoutId);
      clearTimeout(timeoutId);
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [items, doc]);

  // Measure header, table header, totals, and footer heights
  useEffect(() => {
    if (!doc) {
      // Reset heights if doc is not available
      setHeaderHeight(0);
      setTableHeaderHeight(0);
      setTotalsHeight(0);
      setFooterHeight(0);
      return;
    }

    let measurementAttempts = 0;
    const maxAttempts = 5;
    let retryTimeoutId: NodeJS.Timeout | null = null;

    const attemptMeasurement = () => {
      measurementAttempts++;
      let allMeasured = true;

      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setHeaderHeight(height);
        } else {
          allMeasured = false;
        }
      } else {
        allMeasured = false;
      }

      if (tableHeaderRef.current) {
        const height = tableHeaderRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setTableHeaderHeight(height);
        } else {
          allMeasured = false;
        }
      } else {
        allMeasured = false;
      }

      if (totalsRef.current) {
        const height = totalsRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setTotalsHeight(height);
        } else {
          allMeasured = false;
        }
      } else {
        allMeasured = false;
      }

      if (footerRef.current) {
        const height = footerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setFooterHeight(height);
        } else {
          allMeasured = false;
        }
      } else {
        allMeasured = false;
      }

      // If not all measured and haven't reached max attempts, try again
      if (!allMeasured && measurementAttempts < maxAttempts) {
        retryTimeoutId = setTimeout(attemptMeasurement, 100);
      }
    };

    const timeoutId = setTimeout(attemptMeasurement, 150);

    return () => {
      clearTimeout(timeoutId);
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [doc, items, t, type]);

  // Calculate available body height for each page type
  const availableBodyHeightFirstPage = useMemo(() => {
    return (
      PAGE_HEIGHT_PX -
      PAGE_PADDING_PX * 2 - // Top and bottom padding
      headerHeight -
      tableHeaderHeight -
      PAGE_NUMBER_HEIGHT_PX -
      20 // Safety margin
    );
  }, [headerHeight, tableHeaderHeight]);

  const availableBodyHeightSubsequentPage = useMemo(() => {
    return (
      PAGE_HEIGHT_PX -
      PAGE_PADDING_PX * 2 - // Top and bottom padding
      tableHeaderHeight -
      PAGE_NUMBER_HEIGHT_PX -
      20 // Safety margin
    );
  }, [tableHeaderHeight]);

  const availableBodyHeightLastPage = useMemo(() => {
    return (
      PAGE_HEIGHT_PX -
      PAGE_PADDING_PX * 2 - // Top and bottom padding
      tableHeaderHeight -
      totalsHeight -
      footerHeight -
      PAGE_NUMBER_HEIGHT_PX -
      20 // Safety margin
    );
  }, [tableHeaderHeight, totalsHeight, footerHeight]);

  // Available height for first page when it's also the last page
  const availableBodyHeightFirstAndLastPage = useMemo(() => {
    return (
      PAGE_HEIGHT_PX -
      PAGE_PADDING_PX * 2 - // Top and bottom padding
      headerHeight -
      tableHeaderHeight -
      totalsHeight -
      footerHeight -
      PAGE_NUMBER_HEIGHT_PX -
      20 // Safety margin
    );
  }, [headerHeight, tableHeaderHeight, totalsHeight, footerHeight]);

  // Pagination algorithm based on measured heights
  const pages = useMemo(() => {
    if (isMeasuring || itemHeights.length === 0 || items.length === 0) {
      // Return empty pages while measuring, or single empty page if no items
      return items.length === 0 ? [[]] : [];
    }

    const result: ItemType[][] = [];
    let currentPageItems: ItemType[] = [];
    let currentPageHeight = 0;
    let isFirstPage = true;

    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights[i];
      const isLastItem = i === items.length - 1;

      // Calculate remaining items height
      const remainingItemsHeight = itemHeights
        .slice(i + 1)
        .reduce((sum, h) => sum + h, 0);

      // Determine if current page will be the last page
      const willBeLastPage = isLastItem || remainingItemsHeight === 0;

      // Determine available height for current page
      let availableHeight: number;
      if (isFirstPage) {
        // Check if this first page will also be the last page
        if (willBeLastPage) {
          // First and last page - need space for header, items, totals, and footer
          availableHeight = availableBodyHeightFirstAndLastPage;
        } else {
          // First page but not last - only need space for header and items
          availableHeight = availableBodyHeightFirstPage;
        }
      } else {
        // Check if remaining items + totals + footer would fit on this page
        const wouldFitOnLastPage =
          currentPageHeight +
            itemHeight +
            remainingItemsHeight +
            totalsHeight +
            footerHeight <=
          availableBodyHeightLastPage;

        if (wouldFitOnLastPage && willBeLastPage) {
          // This page will be the last page
          availableHeight = availableBodyHeightLastPage;
        } else {
          // Regular subsequent page
          availableHeight = availableBodyHeightSubsequentPage;
        }
      }

      // Calculate space needed if we add this item
      const spaceNeeded = currentPageHeight + itemHeight;

      // If this will be the last page, we need to reserve space for totals and footer
      const spaceNeededWithTotals = willBeLastPage
        ? spaceNeeded + totalsHeight + footerHeight
        : spaceNeeded;

      // Check if item fits on current page (accounting for totals if last page)
      if (spaceNeededWithTotals <= availableHeight) {
        currentPageItems.push(items[i]);
        currentPageHeight += itemHeight;
      } else {
        // Start new page
        if (currentPageItems.length > 0) {
          result.push(currentPageItems);
        }
        currentPageItems = [items[i]];
        currentPageHeight = itemHeight;
        isFirstPage = false;
      }
    }

    // Add remaining items
    if (currentPageItems.length > 0) {
      result.push(currentPageItems);
    }

    // Handle empty items case
    if (result.length === 0 && items.length === 0) {
      result.push([]);
    }

    return result;
  }, [
    isMeasuring,
    itemHeights,
    items,
    availableBodyHeightFirstPage,
    availableBodyHeightSubsequentPage,
    availableBodyHeightLastPage,
    availableBodyHeightFirstAndLastPage,
    totalsHeight,
    footerHeight,
  ]);

  const numberOfPages = pages.length;

  // Early returns after all hooks
  if ((type === "quote" && !quoteId) || (type === "invoice" && !invoiceId))
    return null;

  if (type === "quote" && !quoteInformation) return null;
  if (type === "invoice" && !invoiceInformation) return null;

  if (!doc) return null;

  // Render measurement container (hidden offscreen)
  const renderMeasurementContainer = () => {
    if (items.length === 0 || !doc) return null;

    return (
      <div ref={measurementContainerRef} className="pdf-measurement-container">
        {/* Measure header */}
        <div ref={headerRef} className="pdf-header-first-page">
          <div className="flex justify-between items-start mb-12">
            <div className="text-left flex flex-col items-start gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.png"
                alt="Sleads"
                className="w-14 h-14 object-cover"
              />
              <h2 className="text-xl font-bold text-sleads-blue">Sleads</h2>
              <p className="text-gray-500">
                <MapPin className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                Rustoordlaan 19, Eefde, {t.country}
              </p>
              <p className="text-gray-500">
                <Mail className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                info@sleads.nl
              </p>
              <p className="text-gray-500">
                <Phone className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                +31 6 20222833
              </p>
              <p className="text-gray-500">
                <Globe className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                <a
                  href="https://sleads.nl"
                  className="text-sleads-blue hover:underline"
                >
                  https://sleads.nl
                </a>
              </p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-sleads-blue uppercase tracking-wide mb-2">
                {type === "quote" ? t.quote : t.invoice}
              </h1>
              <p className="text-gray-500 font-medium">
                {type === "quote" && quoteInformation
                  ? quoteInformation.quote.quoteIdentifiefier
                  : type === "invoice" && invoiceInformation
                    ? invoiceInformation.invoice.invoiceIdentifiefier || "Draft"
                    : "Draft"}
              </p>
              <h2 className="text-xl font-bold text-white mb-2">Sleads</h2>
              <div className="flex flex-col gap-2">
                <p className="text-gray-500">
                  <Building2 className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                  KVK: 81047959
                </p>
                <p className="text-gray-500">
                  <Landmark className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                  BTW: NL003524858B07
                </p>
                <p className="text-gray-500">
                  <HandCoins className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                  IBAN: NL76 KNAB 0607 6859 80
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mb-12">
            <div className="text-left">
              <div className="space-y-2">
                <div className="flex justify-start gap-8">
                  <span className="text-gray-500 font-semibold w-24">
                    {t.date}:
                  </span>
                  <span>
                    {type === "quote" && quoteInformation
                      ? quoteInformation.quote.quoteDate
                        ? new Date(
                            quoteInformation.quote.quoteDate
                          ).toLocaleDateString("nl-NL")
                        : t.draft
                      : type === "invoice" && invoiceInformation
                        ? invoiceInformation.invoice.invoiceDate
                          ? new Date(
                              invoiceInformation.invoice.invoiceDate
                            ).toLocaleDateString("nl-NL")
                          : t.draft
                        : t.draft}
                  </span>
                </div>
                <div className="flex justify-start gap-8">
                  <span className="text-gray-500 font-semibold w-24">
                    {type === "quote" ? t.validUntil : t.dueDate}:
                  </span>
                  <span>
                    {type === "quote" && quoteInformation
                      ? quoteInformation.quote.quoteValidUntil
                        ? new Date(
                            quoteInformation.quote.quoteValidUntil
                          ).toLocaleDateString("nl-NL")
                        : "N/A"
                      : type === "invoice" && invoiceInformation
                        ? invoiceInformation.invoice.invoiceDueDate
                          ? new Date(
                              invoiceInformation.invoice.invoiceDueDate
                            ).toLocaleDateString("nl-NL")
                          : "N/A"
                        : "N/A"}
                  </span>
                </div>
                {project && (
                  <div className="flex justify-start gap-8">
                    <span className="text-gray-500 font-semibold w-24">
                      {t.project}:
                    </span>
                    <span>{project.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">
                {t.billTo}:
              </h3>
              {contactInfo ? (
                <div className="space-y-1">
                  <p className="font-bold text-lg">
                    {contactInfo.organizationName}
                  </p>
                  <p className="font-bold">{contactInfo.name}</p>
                  <p>{contactInfo.address}</p>
                  <p>{contactInfo.email}</p>
                  <p>{contactInfo.phone}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic">{t.noContact}</p>
              )}
            </div>
          </div>
        </div>

        {/* Measure table header */}
        <table className="w-full table-fixed pdf-items-table">
          <thead ref={tableHeaderRef} className="pdf-table-header">
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-3 font-bold uppercase text-xs w-[40%]">
                {t.description}
              </th>
              <th className="text-right py-3 font-bold uppercase text-xs w-[12%]">
                {t.qty}
              </th>
              <th className="text-right py-3 font-bold uppercase text-xs w-[16%]">
                {t.price}
              </th>
              <th className="text-right py-3 font-bold uppercase text-xs w-[12%]">
                {t.tax}
              </th>
              <th className="text-right py-3 font-bold uppercase text-xs w-[20%]">
                {t.total}
              </th>
            </tr>
          </thead>
        </table>

        {/* Measure item rows */}
        <table className="w-full table-fixed pdf-items-table">
          <tbody>
            {items.map((item: ItemType, idx: number) => (
              <tr
                key={idx}
                ref={(el) => {
                  itemRowRefs.current[idx] = el;
                }}
                className="border-b border-gray-100 text-xs pdf-table-row"
              >
                <td className="py-3 pr-2 align-top">
                  <p className="font-bold text-sm wrap-break-word">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-gray-500 wrap-break-word text-[10px] leading-relaxed mt-1">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.description,
                        }}
                      />
                    </p>
                  )}
                </td>
                <td className="text-right py-3 align-top">{item.quantity}</td>
                <td className="text-right py-3 align-top">
                  €{item.priceExclTax.toFixed(2)}
                </td>
                <td className="text-right py-3 align-top">{item.tax}%</td>
                <td className="text-right py-3 font-medium align-top">
                  €{(item.quantity * item.priceExclTax).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Measure totals */}
        <div
          ref={totalsRef}
          className="pdf-totals-section flex justify-end border-t border-gray-200 pt-8"
        >
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-500">
              <span>{t.subtotal}:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t.taxVat}:</span>
              <span>€{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-gray-900 pt-3">
              <span>{t.total}:</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Measure footer */}
        <div ref={footerRef} className="pdf-footer-section">
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 text-center space-y-2">
            {type === "invoice" && <p>{t.paymentTerms}</p>}
            <p>
              {t.readPrivacy}{" "}
              <a
                href="https://sleads.nl/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-sleads-blue hover:underline"
              >
                https://sleads.nl/privacy-policy
              </a>{" "}
              {t.readTerms}{" "}
              <a
                href="https://sleads.nl/terms-of-service"
                target="_blank"
                rel="noreferrer"
                className="text-sleads-blue hover:underline"
              >
                https://sleads.nl/terms-of-service
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Hidden measurement container - rendered outside main container */}
      <div
        style={{
          position: "fixed",
          top: "-99999px",
          left: "-99999px",
          visibility: "hidden",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -999999,
        }}
      >
        {renderMeasurementContainer()}
      </div>
      <div className="pdf-document-container">
        {/* Show loading state while measuring */}
        {isMeasuring && (
          <div className="pdf-page bg-white shadow-lg w-[210mm] p-[20mm] mx-auto text-sm text-gray-900 border border-gray-200 relative">
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Render pages with measured pagination */}
        {!isMeasuring &&
          pages.map((pageItems, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;

            return (
              <div
                key={pageIndex}
                className={`pdf-page bg-white shadow-lg w-[210mm] p-[20mm] mx-auto text-sm text-gray-900 border border-gray-200 relative ${numberOfPages === 1 ? "single-page" : ""}`}
                style={{
                  marginBottom: pageIndex < numberOfPages - 1 ? "60px" : "20px",
                }}
              >
                {/* Header - Only on First Page */}
                {isFirstPage && (
                  <div className="pdf-header-first-page">
                    <div className="flex justify-between items-start mb-12">
                      <div className="text-left flex flex-col items-start gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logo.png"
                          alt="Sleads"
                          className="w-14 h-14  object-cover "
                        />
                        <h2 className="text-xl font-bold text-sleads-blue">
                          Sleads
                        </h2>
                        <p className="text-gray-500">
                          <MapPin className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                          Rustoordlaan 19, Eefde, {t.country}
                        </p>
                        <p className="text-gray-500">
                          <Mail className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                          info@sleads.nl
                        </p>
                        <p className="text-gray-500">
                          <Phone className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                          +31 6 20222833
                        </p>
                        <p className="text-gray-500">
                          <Globe className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                          <a
                            href="https://sleads.nl"
                            className="text-sleads-blue hover:underline"
                          >
                            https://sleads.nl
                          </a>
                        </p>
                      </div>
                      <div className="text-right">
                        <h1 className="text-3xl font-bold text-sleads-blue uppercase tracking-wide mb-2">
                          {type === "quote" ? t.quote : t.invoice}
                        </h1>
                        <p className="text-gray-500 font-medium">
                          {type === "quote" && quoteInformation
                            ? quoteInformation.quote.quoteIdentifiefier
                            : type === "invoice" && invoiceInformation
                              ? invoiceInformation.invoice
                                  .invoiceIdentifiefier || "Draft"
                              : "Draft"}
                        </p>
                        <h2 className="text-xl font-bold text-white mb-2">
                          Sleads
                        </h2>
                        <div className="flex flex-col gap-2">
                          <p className="text-gray-500">
                            <Building2 className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                            KVK: 81047959
                          </p>
                          <p className="text-gray-500">
                            <Landmark className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                            BTW: NL003524858B07
                          </p>
                          <p className="text-gray-500">
                            <HandCoins className="w-4 h-4 inline-block mr-2 text-sleads-blue" />{" "}
                            IBAN: NL76 KNAB 0607 6859 80
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mb-12">
                      <div className="text-left">
                        <div className="space-y-2">
                          <div className="flex justify-start gap-8">
                            <span className="text-gray-500 font-semibold w-24">
                              {t.date}:
                            </span>
                            <span>
                              {type === "quote" && quoteInformation
                                ? quoteInformation.quote.quoteDate
                                  ? new Date(
                                      quoteInformation.quote.quoteDate
                                    ).toLocaleDateString("nl-NL")
                                  : t.draft
                                : type === "invoice" && invoiceInformation
                                  ? invoiceInformation.invoice.invoiceDate
                                    ? new Date(
                                        invoiceInformation.invoice.invoiceDate
                                      ).toLocaleDateString("nl-NL")
                                    : t.draft
                                  : t.draft}
                            </span>
                          </div>
                          <div className="flex justify-start gap-8">
                            <span className="text-gray-500 font-semibold w-24">
                              {type === "quote" ? t.validUntil : t.dueDate}:
                            </span>
                            <span>
                              {type === "quote" && quoteInformation
                                ? quoteInformation.quote.quoteValidUntil
                                  ? new Date(
                                      quoteInformation.quote.quoteValidUntil
                                    ).toLocaleDateString("nl-NL")
                                  : "N/A"
                                : type === "invoice" && invoiceInformation
                                  ? invoiceInformation.invoice.invoiceDueDate
                                    ? new Date(
                                        invoiceInformation.invoice
                                          .invoiceDueDate
                                      ).toLocaleDateString("nl-NL")
                                    : "N/A"
                                  : "N/A"}
                            </span>
                          </div>
                          {project && (
                            <div className="flex justify-start gap-8">
                              <span className="text-gray-500 font-semibold w-24">
                                {t.project}:
                              </span>
                              <span>{project.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="text-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">
                          {t.billTo}:
                        </h3>
                        {contactInfo ? (
                          <div className="space-y-1">
                            <p className="font-bold text-lg">
                              {contactInfo.organizationName}
                            </p>
                            <p className="font-bold">{contactInfo.name}</p>
                            <p>{contactInfo.address}</p>
                            <p>{contactInfo.email}</p>
                            <p>{contactInfo.phone}</p>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">{t.noContact}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                {pageItems.length > 0 && (
                  <div
                    className={`pdf-items-container ${numberOfPages === 1 ? "single-page" : ""}`}
                  >
                    <table className="w-full table-fixed pdf-items-table">
                      <thead className="pdf-table-header">
                        <tr className="border-b-2 border-gray-900">
                          <th className="text-left py-3 font-bold uppercase text-xs w-[40%]">
                            {t.description}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[12%]">
                            {t.qty}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[16%]">
                            {t.price}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[12%]">
                            {t.tax}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[20%]">
                            {t.total}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((item: ItemType) => {
                          const globalIdx = items.indexOf(item);
                          return (
                            <tr
                              key={globalIdx}
                              className="border-b border-gray-100 text-xs pdf-table-row"
                            >
                              <td className="py-3 pr-2 align-top">
                                <p className="font-bold text-sm wrap-break-word">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-gray-500 wrap-break-word text-[10px] leading-relaxed mt-1">
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: item.description,
                                      }}
                                    />
                                  </p>
                                )}
                              </td>
                              <td className="text-right py-3 align-top">
                                {item.quantity}
                              </td>
                              <td className="text-right py-3 align-top">
                                €{item.priceExclTax.toFixed(2)}
                              </td>
                              <td className="text-right py-3 align-top">
                                {item.tax}%
                              </td>
                              <td className="text-right py-3 font-medium align-top">
                                €
                                {(item.quantity * item.priceExclTax).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {isFirstPage && items.length === 0 && (
                  <div className="pdf-items-container">
                    <table className="w-full table-fixed pdf-items-table">
                      <thead className="pdf-table-header">
                        <tr className="border-b-2 border-gray-900">
                          <th className="text-left py-3 font-bold uppercase text-xs w-[40%]">
                            {t.description}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[12%]">
                            {t.qty}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[16%]">
                            {t.price}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[12%]">
                            {t.tax}
                          </th>
                          <th className="text-right py-3 font-bold uppercase text-xs w-[20%]">
                            {t.total}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-gray-400 italic"
                          >
                            {t.noItems}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals - Only on last page */}
                {isLastPage && (
                  <>
                    <div
                      className={`pdf-totals-section flex justify-end border-t border-gray-200 pt-8 ${numberOfPages === 1 ? "single-page-totals" : ""}`}
                    >
                      <div className="w-64 space-y-3">
                        <div className="flex justify-between text-gray-500">
                          <span>{t.subtotal}:</span>
                          <span>€{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>{t.taxVat}:</span>
                          <span>€{totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t border-gray-900 pt-3">
                          <span>{t.total}:</span>
                          <span>€{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Section - Only on last page */}
                    <div
                      className={`pdf-footer-section ${numberOfPages === 1 ? "single-page-footer" : ""}`}
                    >
                      <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 text-center space-y-2">
                        {type === "invoice" && <p>{t.paymentTerms}</p>}
                        <p>
                          {t.readPrivacy}{" "}
                          <a
                            href="https://sleads.nl/privacy-policy"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sleads-blue hover:underline"
                          >
                            https://sleads.nl/privacy-policy
                          </a>{" "}
                          {t.readTerms}{" "}
                          <a
                            href="https://sleads.nl/terms-of-service"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sleads-blue hover:underline"
                          >
                            https://sleads.nl/terms-of-service
                          </a>
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Page Number - Always show, even on single page */}
                <div className="pdf-page-number">
                  {t.page} {pageIndex + 1}
                  {numberOfPages > 1 && ` ${t.of} ${numberOfPages}`}
                </div>

                {/* Visual page break indicator (only between pages, not after last) */}
                {!isLastPage && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"
                    style={{ marginBottom: "-60px" }}
                  />
                )}
              </div>
            );
          })}
      </div>
    </>
  );
};
