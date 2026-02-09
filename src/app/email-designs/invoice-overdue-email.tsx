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

interface InvoiceOverdueEmailProps {
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
    preview: "Reminder: Your invoice from Sleads is overdue",
    greeting: "Hi",
    subject: "Payment Reminder - Overdue Invoice from Sleads",
    intro:
      "We wanted to remind you that payment for the invoice below is now overdue. Please arrange payment as soon as possible.",
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
    portalInfo: "Pay Invoice in Portal",
    portalDescription:
      "You can view and pay this invoice directly through your portal. Please arrange payment as soon as possible to avoid any further action.",
    viewInPortal: "View in Portal",
    footer:
      "If you have already made payment, please ignore this reminder. If you have any questions or need assistance, please don't hesitate to contact us.",
    copyright: "© {year} Sleads. All rights reserved.",
  },
  nl: {
    preview: "Herinnering: Uw factuur van Sleads is achterstallig",
    greeting: "Hallo",
    subject: "Betalingsherinnering - Achterstallige Factuur van Sleads",
    intro:
      "We willen u eraan herinneren dat de betaling voor de onderstaande factuur nu achterstallig is. Regel de betaling alstublieft zo spoedig mogelijk.",
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
    portalInfo: "Betaal Factuur in Portaal",
    portalDescription:
      "U kunt deze factuur bekijken en betalen via uw portaal. Regel de betaling alstublieft zo spoedig mogelijk om verdere actie te voorkomen.",
    viewInPortal: "Bekijk in Portaal",
    footer:
      "Als u de betaling al heeft gedaan, negeer dan deze herinnering. Als u vragen heeft of hulp nodig heeft, aarzel dan niet om contact met ons op te nemen.",
    copyright: "© {year} Sleads. Alle rechten voorbehouden.",
  },
};

export const InvoiceOverdueEmail = ({
  invoice,
  contactPerson,
  portalUrl,
  invoiceFileUrl,
}: InvoiceOverdueEmailProps) => {
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
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#EF4444] to-transparent opacity-75" />
              <div className="h-2 w-full bg-[#EF4444] opacity-20" />
              <div className="h-32 w-full bg-[linear-gradient(180deg,rgba(239,68,68,0.15)_0%,rgba(15,23,42,0)_100%)]" />
              <div className="mt-[-80px] text-center mb-[40px]">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-red-500 blur-[30px] opacity-30 rounded-full" />
                  <Img
                    src="https://sleads.nl/images/logo.png"
                    width="64"
                    height="64"
                    alt="Sleads"
                    className="relative rounded-2xl shadow-[0_0_40px_-10px_rgba(239,68,68,0.6)] border border-white/10"
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
                <Text className="text-xs font-bold text-[#EF4444] uppercase tracking-wider mb-4">
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
                      <Text className="text-[#EF4444] text-[13px] font-semibold m-0">
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
                <Text className="text-xs font-bold text-[#EF4444] uppercase tracking-wider mb-4">
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
                    <Text className="text-[#EF4444] text-[18px] font-bold m-0">
                      €{grandTotal.toFixed(2)}
                    </Text>
                  </Column>
                </Row>
              </Section>
              {/* Portal Information */}
              <Section className="bg-linear-to-r from-[#EF4444]/10 to-transparent rounded-xl border border-[#EF4444]/20 p-6 mb-6">
                <Text className="text-white text-[16px] font-bold mb-2">
                  {t.portalInfo}
                </Text>
                <Text className="text-sleads-text text-[14px] leading-[22px] mb-4">
                  {t.portalDescription}
                </Text>
                <Section className="text-center">
                  <Link
                    className="bg-[#EF4444] text-white rounded-full text-[14px] font-bold no-underline text-center px-6 py-3 inline-block shadow-[0_4px_20px_-5px_rgba(239,68,68,0.5)] border border-white/10"
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

export function renderInvoiceOverdueEmail(props: InvoiceOverdueEmailProps) {
  return render(<InvoiceOverdueEmail {...props} />);
}

export default InvoiceOverdueEmail;





