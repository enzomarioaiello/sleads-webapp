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
} from "@react-email/components";
import React from "react";

interface SubscriptionCancellationEmailProps {
  subscription: {
    _id: string;
    title: string;
    description: string;
    subscriptionAmount: number;
    tax: 0 | 9 | 21;
    subscriptionStartDate: number;
    subscriptionEndDate: number | null;
    subscriptionStatus: "active" | "cancelled" | "inactive";
    language: "en" | "nl";
  };
  contactPerson: {
    name: string;
    email: string;
    organizationName: string;
  };
  cancellationDate?: number | null;
  message?: string | null;
  portalUrl: string;
}

const translations = {
  en: {
    preview: "Your subscription cancellation request has been received",
    greeting: "Hi",
    subject: "Subscription Cancellation Request Received - Sleads",
    intro:
      "We have received your request to cancel your subscription. We will process your request and get back to you shortly.",
    subscriptionDetails: "Subscription Details",
    subscription: "Subscription",
    status: "Status",
    amount: "Amount",
    startDate: "Start Date",
    endDate: "End Date",
    cancellationDate: "Requested Cancellation Date",
    tax: "Tax",
    yourMessage: "Your Message",
    portalInfo: "View Subscription in Portal",
    portalDescription:
      "You can view and manage your subscription directly through your portal.",
    viewInPortal: "View in Portal",
    footer:
      "If you have any questions or need to modify your cancellation request, please don't hesitate to reach out to us.",
    copyright: "© {year} Sleads. All rights reserved.",
  },
  nl: {
    preview: "Uw verzoek tot opzegging van abonnement is ontvangen",
    greeting: "Hallo",
    subject: "Verzoek tot Opzegging Abonnement Ontvangen - Sleads",
    intro:
      "We hebben uw verzoek om uw abonnement op te zeggen ontvangen. We zullen uw verzoek verwerken en zo spoedig mogelijk contact met u opnemen.",
    subscriptionDetails: "Abonnement Details",
    subscription: "Abonnement",
    status: "Status",
    amount: "Bedrag",
    startDate: "Startdatum",
    endDate: "Einddatum",
    cancellationDate: "Gevraagde Opzegdatum",
    tax: "BTW",
    yourMessage: "Uw Bericht",
    portalInfo: "Bekijk Abonnement in Portaal",
    portalDescription:
      "U kunt uw abonnement bekijken en beheren via uw portaal.",
    viewInPortal: "Bekijk in Portaal",
    footer:
      "Als u vragen heeft of uw opzegverzoek wilt wijzigen, aarzel dan niet om contact met ons op te nemen.",
    copyright: "© {year} Sleads. Alle rechten voorbehouden.",
  },
};

export const SubscriptionCancellationEmail = ({
  subscription,
  contactPerson,
  cancellationDate,
  message,
  portalUrl,
}: SubscriptionCancellationEmailProps) => {
  const t = translations[subscription.language];
  const previewText = t.preview;

  const startDate = new Date(subscription.subscriptionStartDate).toLocaleDateString(
    subscription.language === "nl" ? "nl-NL" : "en-US"
  );
  const endDate = subscription.subscriptionEndDate
    ? new Date(subscription.subscriptionEndDate).toLocaleDateString(
        subscription.language === "nl" ? "nl-NL" : "en-US"
      )
    : null;
  const cancellationDateText = cancellationDate
    ? new Date(cancellationDate).toLocaleDateString(
        subscription.language === "nl" ? "nl-NL" : "en-US"
      )
    : null;

  const amountWithTax =
    subscription.subscriptionAmount * (1 + subscription.tax / 100);

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
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-2xl">
            {/* Header */}
            <Section className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <Heading className="text-2xl font-bold text-gray-900 mb-2">
                {t.greeting} {contactPerson.name},
              </Heading>
              <Text className="text-gray-700 text-base leading-relaxed">
                {t.intro}
              </Text>
            </Section>

            {/* Subscription Details */}
            <Section className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <Heading className="text-xl font-bold text-gray-900 mb-6">
                {t.subscriptionDetails}
              </Heading>

              <div className="space-y-4">
                <div>
                  <Text className="text-sm font-semibold text-gray-600 mb-1">
                    {t.subscription}:
                  </Text>
                  <Text className="text-base text-gray-900">
                    {subscription.title}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm font-semibold text-gray-600 mb-1">
                    {t.status}:
                  </Text>
                  <Text className="text-base text-gray-900 capitalize">
                    {subscription.subscriptionStatus}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm font-semibold text-gray-600 mb-1">
                    {t.amount}:
                  </Text>
                  <Text className="text-base text-gray-900">
                    €{subscription.subscriptionAmount.toFixed(2)}/month
                    {subscription.tax > 0 && (
                      <span className="text-gray-600 text-sm ml-2">
                        ({t.tax}: {subscription.tax}% = €
                        {amountWithTax.toFixed(2)}/month)
                      </span>
                    )}
                  </Text>
                </div>

                <div>
                  <Text className="text-sm font-semibold text-gray-600 mb-1">
                    {t.startDate}:
                  </Text>
                  <Text className="text-base text-gray-900">{startDate}</Text>
                </div>

                {endDate && (
                  <div>
                    <Text className="text-sm font-semibold text-gray-600 mb-1">
                      {t.endDate}:
                    </Text>
                    <Text className="text-base text-gray-900">{endDate}</Text>
                  </div>
                )}

                {cancellationDateText && (
                  <div>
                    <Text className="text-sm font-semibold text-gray-600 mb-1">
                      {t.cancellationDate}:
                    </Text>
                    <Text className="text-base text-gray-900 font-semibold">
                      {cancellationDateText}
                    </Text>
                  </div>
                )}
              </div>
            </Section>

            {/* User Message */}
            {message && (
              <Section className="bg-white rounded-lg shadow-sm p-8 mb-6">
                <Heading className="text-xl font-bold text-gray-900 mb-4">
                  {t.yourMessage}
                </Heading>
                <Text className="text-base text-gray-700 whitespace-pre-wrap">
                  {message}
                </Text>
              </Section>
            )}

            {/* Portal Link */}
            <Section className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <Heading className="text-xl font-bold text-gray-900 mb-2">
                {t.portalInfo}
              </Heading>
              <Text className="text-gray-700 text-base mb-4">
                {t.portalDescription}
              </Text>
              <Link
                href={portalUrl}
                className="inline-block bg-sleads-blue text-white font-semibold py-3 px-6 rounded-lg no-underline hover:bg-blue-600 transition-colors"
              >
                {t.viewInPortal}
              </Link>
            </Section>

            {/* Footer */}
            <Section className="text-center text-gray-600 text-sm">
              <Text className="mb-2">{t.footer}</Text>
              <Hr className="border-gray-300 my-6" />
              <Text className="text-gray-500">
                {t.copyright.replace("{year}", new Date().getFullYear().toString())}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const renderSubscriptionCancellationEmail = async (
  props: SubscriptionCancellationEmailProps
): Promise<string> => {
  return render(<SubscriptionCancellationEmail {...props} />);
};

