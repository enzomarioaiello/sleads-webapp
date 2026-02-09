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

interface NewInvoiceEmailProps {
  invoice: {
    invoiceIdentifiefier: string | null;
    invoiceDate: number | null;
    invoiceDueDate: number | null;
    invoiceItems: InvoiceItem[];
    language: "en" | "nl";
    subscriptionIds?: string[] | null;
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
    preview: "Your invoice from Sleads",
    greeting: "Hi",
    subject: "Your Invoice from Sleads",
    subjectSubscription: "Your Invoice for Running Subscriptions with Sleads",
    intro:
      "We're excited to share your invoice with you. Below you'll find a detailed overview of all items and pricing.",
    introSubscription:
      "This is your invoice for your running subscriptions with Sleads. Below you'll find a detailed overview of all subscription items and pricing.",
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
      "You can review and manage this invoice directly through your portal. Simply log in to access all your invoices and manage them in one place.",
    viewInPortal: "View in Portal",
    downloadPdf: "Download PDF",
    footer:
      "If you have any questions about this invoice, please don't hesitate to reach out to us.",
    copyright: "© {year} Sleads. All rights reserved.",
  },
  nl: {
    preview: "Uw factuur van Sleads",
    greeting: "Hallo",
    subject: "Uw Factuur van Sleads",
    subjectSubscription: "Uw Factuur voor Uw Lopende Abonnementen bij Sleads",
    intro:
      "We zijn blij om uw factuur met u te delen. Hieronder vindt u een gedetailleerd overzicht van alle items en prijzen.",
    introSubscription:
      "Dit is uw factuur voor uw lopende abonnementen bij Sleads. Hieronder vindt u een gedetailleerd overzicht van alle abonnementsitems en prijzen.",
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
      "U kunt deze factuur bekijken en beheren via uw portaal. Log eenvoudig in om al uw facturen te bekijken en te beheren op één plek.",
    viewInPortal: "Bekijk in Portaal",
    downloadPdf: "Download PDF",
    footer:
      "Als u vragen heeft over deze factuur, aarzel dan niet om contact met ons op te nemen.",
    copyright: "© {year} Sleads. Alle rechten voorbehouden.",
  },
};

export const NewInvoiceEmail = ({
  invoice,
  contactPerson,
  portalUrl,
  invoiceFileUrl,
}: NewInvoiceEmailProps) => {
  const t = translations[invoice.language];
  const previewText = t.preview;
  // Check if this is a subscription invoice - subscriptionIds should be an array with at least one item
  const isSubscriptionInvoice =
    invoice.subscriptionIds !== null &&
    invoice.subscriptionIds !== undefined &&
    Array.isArray(invoice.subscriptionIds) &&
    invoice.subscriptionIds.length > 0;

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
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#3B82F6] to-transparent opacity-75" />
              <div className="h-2 w-full bg-[#3B82F6] opacity-20" />
              <div className="h-32 w-full bg-[linear-gradient(180deg,rgba(59,130,246,0.15)_0%,rgba(15,23,42,0)_100%)]" />
              <div className="mt-[-80px] text-center mb-[40px]">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-blue-500 blur-[30px] opacity-30 rounded-full" />
                  <Img
                    src="https://sleads.nl/images/logo.png"
                    width="64"
                    height="64"
                    alt="Sleads"
                    className="relative rounded-2xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)] border border-white/10"
                  />
                </div>
              </div>
            </Section>

            <Section className="bg-sleads-card px-10 pb-10 rounded-b-2xl border border-t-0 border-white/10 mt-[-20px]">
              <Heading className="text-white text-[28px] font-bold text-center p-0 my-[16px] mx-0 tracking-tight">
                {isSubscriptionInvoice ? t.subjectSubscription : t.subject}
              </Heading>
              <Text className="text-sleads-text text-[16px] leading-[26px] text-center mb-6">
                {t.greeting}{" "}
                <span className="text-white font-medium">
                  {contactPerson.name}
                </span>
                ,
              </Text>
              <Text className="text-sleads-text text-[15px] leading-[24px] text-center mb-8">
                {isSubscriptionInvoice ? t.introSubscription : t.intro}
              </Text>
              {/* Invoice Details Section */}
              <Section className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
                <Text className="text-xs font-bold text-sleads-blue uppercase tracking-wider mb-4">
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
                <Text className="text-xs font-bold text-sleads-blue uppercase tracking-wider mb-4">
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
                          <span
                            dangerouslySetInnerHTML={{
                              __html: item.description,
                            }}
                          />
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
                    <Text className="text-sleads-blue text-[18px] font-bold m-0">
                      €{grandTotal.toFixed(2)}
                    </Text>
                  </Column>
                </Row>
              </Section>
              {/* Portal Information */}
              <Section className="bg-linear-to-r from-[#3B82F6]/10 to-transparent rounded-xl border border-[#3B82F6]/20 p-6 mb-6">
                <Text className="text-white text-[16px] font-bold mb-2">
                  {t.portalInfo}
                </Text>
                <Text className="text-sleads-text text-[14px] leading-[22px] mb-4">
                  {t.portalDescription}
                </Text>
                <Section className="text-center">
                  <Link
                    className="bg-[#3B82F6] text-white rounded-full text-[14px] font-bold no-underline text-center px-6 py-3 inline-block shadow-[0_4px_20px_-5px_rgba(59,130,246,0.5)] border border-white/10"
                    href={portalUrl}
                  >
                    {t.viewInPortal}
                  </Link>
                </Section>
              </Section>
              {/* Download PDF Button
              {invoiceFileUrl && (
                <Section className="text-center mb-6">
                  <Link
                    className="text-sleads-blue text-[14px] font-medium no-underline hover:underline"
                    href={invoiceFileUrl}
                  >
                    {t.downloadPdf}
                  </Link>
                </Section>
              )} */}
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

export function renderNewInvoiceEmail(props: NewInvoiceEmailProps) {
  return render(<NewInvoiceEmail {...props} />);
}

export default NewInvoiceEmail;
