import { render } from "@react-email/render";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import React from "react";

interface InvoiceItem {
  name: string;
  description: string;
  quantity: number;
  priceExclTax: number;
  tax: 0 | 9 | 21;
}

interface InvoicePaidEmailProps {
  invoice: {
    invoiceIdentifiefier: string | null;
    invoiceDate: number | null;
    invoiceDueDate: number | null;
    invoiceItems: InvoiceItem[];
    language: "en" | "nl";
  };
  contactPerson: {
    name: string;
    email: string;
    organizationName: string;
  };
  portalUrl: string;
  invoiceFileUrl?: string | null;
}

const translations = {
  en: {
    preview: "Payment received for your invoice from Sleads",
    greeting: "Hi",
    subject: "Payment Received - Invoice from Sleads",
    intro:
      "We're pleased to confirm that we have received payment for your invoice. Thank you for your prompt payment!",
    invoiceDetails: "Invoice Details",
    invoiceNumber: "Invoice Number",
    date: "Date",
    dueDate: "Due Date",
    items: "Items",
    description: "Description",
    quantity: "Qty",
    price: "Price",
    tax: "Tax",
    total: "Total",
    subtotal: "Subtotal",
    taxVat: "Tax (VAT)",
    grandTotal: "Grand Total",
    portalInfo: "View Invoice in Portal",
    portalDescription:
      "You can view this invoice and all your payment history directly through your portal.",
    viewInPortal: "View in Portal",
    footer:
      "Thank you for your business! If you have any questions, please don't hesitate to reach out to us.",
    copyright: "© {year} Sleads. All rights reserved.",
  },
  nl: {
    preview: "Betaling ontvangen voor uw factuur van Sleads",
    greeting: "Hallo",
    subject: "Betaling Ontvangen - Factuur van Sleads",
    intro:
      "We zijn blij te bevestigen dat we de betaling voor uw factuur hebben ontvangen. Bedankt voor uw snelle betaling!",
    invoiceDetails: "Factuur Details",
    invoiceNumber: "Factuurnummer",
    date: "Datum",
    dueDate: "Vervaldatum",
    items: "Items",
    description: "Omschrijving",
    quantity: "Aantal",
    price: "Prijs",
    tax: "BTW",
    total: "Totaal",
    subtotal: "Subtotaal",
    taxVat: "BTW",
    grandTotal: "Totaalbedrag",
    portalInfo: "Bekijk Factuur in Portaal",
    portalDescription:
      "U kunt deze factuur en al uw betalingsgeschiedenis bekijken via uw portaal.",
    viewInPortal: "Bekijk in Portaal",
    footer:
      "Bedankt voor uw zaken! Als u vragen heeft, aarzel dan niet om contact met ons op te nemen.",
    copyright: "© {year} Sleads. Alle rechten voorbehouden.",
  },
};

export const InvoicePaidEmail = ({
  invoice,
  contactPerson,
  portalUrl,
  invoiceFileUrl,
}: InvoicePaidEmailProps) => {
  const t = translations[invoice.language];
  const previewText = t.preview;

  // Calculate totals
  const subtotal = invoice.invoiceItems.reduce(
    (acc, item) => acc + item.quantity * item.priceExclTax,
    0
  );
  const totalTax = invoice.invoiceItems.reduce(
    (acc, item) => acc + item.quantity * item.priceExclTax * (item.tax / 100),
    0
  );
  const grandTotal = subtotal + totalTax;

  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                "sleads-blue": "#3B82F6",
                "sleads-dark": "#020617",
                "sleads-card": "#0F172A",
                "sleads-text": "#94A3B8",
              },
            },
          },
        }}
      >
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-sleads-dark my-auto mx-auto font-sans text-white">
          <Container className="my-[40px] mx-auto max-w-[600px]">
            {/* Top section with logo */}
            <Section className="rounded-t-2xl overflow-hidden bg-sleads-card border border-white/10 border-b-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#10B981] to-transparent opacity-75" />
              <div className="h-2 w-full bg-[#10B981] opacity-20" />
              <div className="h-32 w-full bg-[linear-gradient(180deg,rgba(16,185,129,0.15)_0%,rgba(15,23,42,0)_100%)]" />
              <div className="mt-[-80px] text-center mb-[40px]">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-green-500 blur-[30px] opacity-30 rounded-full" />
                  <Img
                    src="https://sleads.nl/images/logo.png"
                    width="64"
                    height="64"
                    alt="Sleads"
                    className="relative rounded-2xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.6)] border border-white/10"
                  />
                </div>
              </div>
            </Section>

            <Section className="bg-sleads-card px-10 pb-10 rounded-b-2xl border border-t-0 border-white/10 mt-[-20px]">
              <Heading className="text-white text-[28px] font-bold text-center p-0 my-[16px] mx-0 tracking-tight">
                {t.subject}
              </Heading>
              <Text className="text-sleads-text text-[16px] leading-[26px] text-center mb-6">
                {t.greeting}{" "}
                <span className="text-white font-medium">
                  {contactPerson.name}
                </span>
                ,
              </Text>
              <Text className="text-sleads-text text-[15px] leading-[24px] text-center mb-8">
                {t.intro}
              </Text>
              {/* Invoice Details Section */}
              <Section className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
                <Text className="text-xs font-bold text-[#10B981] uppercase tracking-wider mb-4">
                  {t.invoiceDetails}
                </Text>

                <Row className="mb-3">
                  <Column>
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                      {t.invoiceNumber}
                    </Text>
                    <Text className="text-white text-[15px] font-semibold m-0">
                      {invoice.invoiceIdentifiefier || "Draft"}
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                      {t.date}
                    </Text>
                    <Text className="text-white text-[13px] m-0">
                      {invoice.invoiceDate
                        ? new Date(invoice.invoiceDate).toLocaleDateString(
                            "nl-NL"
                          )
                        : "Draft"}
                    </Text>
                  </Column>
                </Row>

                {invoice.invoiceDueDate && (
                  <Row>
                    <Column>
                      <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                        {t.dueDate}
                      </Text>
                      <Text className="text-white text-[13px] m-0">
                        {new Date(invoice.invoiceDueDate).toLocaleDateString(
                          "nl-NL"
                        )}
                      </Text>
                    </Column>
                  </Row>
                )}
              </Section>
              {/* Items Table */}
              <Section className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
                <Text className="text-xs font-bold text-[#10B981] uppercase tracking-wider mb-4">
                  {t.items}
                </Text>

                {/* Table Header */}
                <Row className="mb-3 pb-2 border-b border-white/10">
                  <Column className="w-[45%]">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0">
                      {t.description}
                    </Text>
                  </Column>
                  <Column className="w-[12%]" align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0">
                      {t.quantity}
                    </Text>
                  </Column>
                  <Column className="w-[18%]" align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0">
                      {t.price}
                    </Text>
                  </Column>
                  <Column className="w-[12%]" align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0">
                      {t.tax}
                    </Text>
                  </Column>
                  <Column className="w-[13%]" align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0">
                      {t.total}
                    </Text>
                  </Column>
                </Row>

                {/* Table Rows */}
                {invoice.invoiceItems.map((item, idx) => {
                  const itemTotal = item.quantity * item.priceExclTax;
                  return (
                    <Row
                      key={idx}
                      className="mb-3 pb-3 border-b border-white/5"
                    >
                      <Column className="w-[45%]">
                        <Text className="text-white text-[13px] font-semibold m-0 mb-1">
                          {item.name}
                        </Text>
                        <Text className="text-sleads-text text-[11px] leading-relaxed m-0">
                          {item.description}
                        </Text>
                      </Column>
                      <Column className="w-[12%]" align="right">
                        <Text className="text-white text-[13px] m-0">
                          {item.quantity}
                        </Text>
                      </Column>
                      <Column className="w-[18%]" align="right">
                        <Text className="text-white text-[13px] m-0">
                          €{item.priceExclTax.toFixed(2)}
                        </Text>
                      </Column>
                      <Column className="w-[12%]" align="right">
                        <Text className="text-white text-[13px] m-0">
                          {item.tax}%
                        </Text>
                      </Column>
                      <Column className="w-[13%]" align="right">
                        <Text className="text-white text-[13px] font-semibold m-0">
                          €{itemTotal.toFixed(2)}
                        </Text>
                      </Column>
                    </Row>
                  );
                })}

                {/* Totals */}
                <Hr className="border-white/10 my-4" />

                <Row className="mb-2">
                  <Column align="right">
                    <Text className="text-sleads-text text-[13px] m-0">
                      {t.subtotal}:
                    </Text>
                  </Column>
                  <Column className="w-[25%]" align="right">
                    <Text className="text-white text-[13px] font-semibold m-0">
                      €{subtotal.toFixed(2)}
                    </Text>
                  </Column>
                </Row>

                <Row className="mb-2">
                  <Column align="right">
                    <Text className="text-sleads-text text-[13px] m-0">
                      {t.taxVat}:
                    </Text>
                  </Column>
                  <Column className="w-[25%]" align="right">
                    <Text className="text-white text-[13px] font-semibold m-0">
                      €{totalTax.toFixed(2)}
                    </Text>
                  </Column>
                </Row>

                <Row className="pt-2 border-t border-white/10">
                  <Column align="right">
                    <Text className="text-white text-[16px] font-bold m-0">
                      {t.grandTotal}:
                    </Text>
                  </Column>
                  <Column className="w-[25%]" align="right">
                    <Text className="text-[#10B981] text-[18px] font-bold m-0">
                      €{grandTotal.toFixed(2)}
                    </Text>
                  </Column>
                </Row>
              </Section>
              {/* Portal Information */}
              <Section className="bg-linear-to-r from-[#10B981]/10 to-transparent rounded-xl border border-[#10B981]/20 p-6 mb-6">
                <Text className="text-white text-[16px] font-bold mb-2">
                  {t.portalInfo}
                </Text>
                <Text className="text-sleads-text text-[14px] leading-[22px] mb-4">
                  {t.portalDescription}
                </Text>
                <Section className="text-center">
                  <Link
                    className="bg-[#10B981] text-white rounded-full text-[14px] font-bold no-underline text-center px-6 py-3 inline-block shadow-[0_4px_20px_-5px_rgba(16,185,129,0.5)] border border-white/10"
                    href={portalUrl}
                  >
                    {t.viewInPortal}
                  </Link>
                </Section>
              </Section>
              <Hr className="border border-white/10 my-[20px] mx-0 w-full" />
              <Text className="text-sleads-text text-[12px] leading-[20px] text-center mb-4">
                {t.footer}
              </Text>
              <Text className="text-sleads-text text-[11px] leading-[18px] text-center opacity-60 mt-6">
                {t.copyright.replace(
                  "{year}",
                  new Date().getFullYear().toString()
                )}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function renderInvoicePaidEmail(props: InvoicePaidEmailProps) {
  return render(<InvoicePaidEmail {...props} />);
}

export default InvoicePaidEmail;





