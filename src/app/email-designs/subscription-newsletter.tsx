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
  Column,
  Row,
} from "@react-email/components";
import React from "react";

interface SubscriptionNewsletterProps {
  email?: string;
  subscriptionId?: string;
}

export const SubscriptionNewsletter = ({
  email,
  subscriptionId,
}: SubscriptionNewsletterProps) => {
  const previewText = "Welcome to the future of digital experiences";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                "sleads-blue": "#3B82F6",
                "sleads-dark": "#020617", // Slate 950
                "sleads-card": "#0F172A", // Slate 900
                "sleads-text": "#94A3B8", // Slate 400
              },
            },
          },
        }}
      >
        <Body className="bg-sleads-dark my-auto mx-auto font-sans text-white">
          <Container className="my-[40px] mx-auto max-w-[560px]">
            {/* Glow Effect Top */}
            <Section className="rounded-t-2xl overflow-hidden bg-sleads-card border border-white/10 border-b-0">
              <div className="h-2 w-full bg-[#3B82F6]" />
              <div className="h-32 w-full bg-[linear-gradient(180deg,rgba(59,130,246,0.15)_0%,rgba(15,23,42,0)_100%)]" />
              <div className="mt-[-80px] text-center mb-[40px]">
                <Img
                  src="https://sleads.nl/images/logo.png"
                  width="56"
                  height="56"
                  alt="Sleads"
                  className="mx-auto rounded-xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
                />
              </div>
            </Section>

            <Section className="bg-sleads-card px-10 pb-10 rounded-b-2xl border border-t-0 border-white/10 mt-[-20px]">
              <Heading className="text-white text-[32px] font-bold text-center p-0 my-[20px] mx-0 tracking-tight">
                Welcome to the <span className="text-[#3B82F6]">Future</span>.
              </Heading>

              <Text className="text-sleads-text text-[16px] leading-[26px] text-center mb-8">
                Hello{" "}
                {email ? (
                  <span className="text-white font-medium">{email}</span>
                ) : (
                  "there"
                )}
                ,
              </Text>

              <Text className="text-sleads-text text-[16px] leading-[26px] text-center">
                You&apos;ve just taken the first step into a larger world. By
                subscribing to Sleads, you&apos;re plugging directly into the
                source of digital innovation.
              </Text>

              <Section className="my-8 p-6 bg-white/5 rounded-xl border border-white/5">
                <Text className="text-white text-[14px] font-bold uppercase tracking-wider mb-4 text-center">
                  Your Access Pass Includes:
                </Text>
                <Row className="mb-3">
                  <Column className="w-8 align-top">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-2" />
                  </Column>
                  <Column>
                    <Text className="text-sleads-text text-[14px] m-0">
                      <strong className="text-white">Insider Insights</strong> —
                      Deep dives into our design philosophy and tech stack.
                    </Text>
                  </Column>
                </Row>
                <Row className="mb-3">
                  <Column className="w-8 align-top">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-2" />
                  </Column>
                  <Column>
                    <Text className="text-sleads-text text-[14px] m-0">
                      <strong className="text-white">Early Access</strong> — Be
                      the first to see our new tools and SaaS products.
                    </Text>
                  </Column>
                </Row>
                <Row>
                  <Column className="w-8 align-top">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-2" />
                  </Column>
                  <Column>
                    <Text className="text-sleads-text text-[14px] m-0">
                      <strong className="text-white">Design Resources</strong> —
                      Exclusive assets and guides for digital creators.
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section className="text-center mt-[40px] mb-[32px]">
                <Link
                  className="bg-[#3B82F6] text-white rounded-full text-[16px] font-bold no-underline text-center px-8 py-4 inline-block shadow-[0_4px_20px_-5px_rgba(59,130,246,0.5)]"
                  href="https://sleads.nl"
                >
                  Explore Our Work
                </Link>
              </Section>

              <Hr className="border border-white/10 my-[26px] mx-0 w-full" />

              <Text className="text-sleads-text text-[12px] leading-[20px] text-center">
                We craft custom software, platforms, and websites that help your
                business grow — without any of the unnecessary fuss.
              </Text>

              <Text className="text-sleads-text text-[12px] leading-[20px] text-center opacity-50">
                © 2026 Sleads. Made in the future.
              </Text>
            </Section>

            <Section className="text-center mt-8">
              <Text className="text-sleads-text text-[11px] opacity-40">
                You received this email because you signed up on our website.
                <br />
                <Link
                  href={`https://sleads.nl/unsubscribe?id=${subscriptionId}`}
                  className="text-sleads-text underline"
                >
                  Click here to unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function renderSubscriptionEmail(props: SubscriptionNewsletterProps) {
  return render(<SubscriptionNewsletter {...props} />);
}

export default SubscriptionNewsletter;
