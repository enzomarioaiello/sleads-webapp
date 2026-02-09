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

interface UnsubscribeNewsletterProps {
  email?: string;
}

export const UnsubscribeNewsletter = ({
  email,
}: UnsubscribeNewsletterProps) => {
  const previewText = "You have been unsubscribed from Sleads";

  return (
    <Html>
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
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-sleads-dark my-auto mx-auto font-sans text-white">
          <Container className="my-[40px] mx-auto max-w-[560px]">
            {/* Glow Effect Top */}
            <Section className="rounded-t-2xl overflow-hidden bg-sleads-card border border-white/10 border-b-0">
              <div className="h-2 w-full bg-slate-700" />
              <div className="h-32 w-full bg-[linear-gradient(180deg,rgba(15,23,42,0.5)_0%,rgba(15,23,42,0)_100%)]" />
              <div className="mt-[-80px] text-center mb-[40px]">
                <Img
                  src="https://sleads.nl/images/logo.png"
                  width="56"
                  height="56"
                  alt="Sleads"
                  className="mx-auto rounded-xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] grayscale opacity-80"
                />
              </div>
            </Section>

            <Section className="bg-sleads-card px-10 pb-10 rounded-b-2xl border border-t-0 border-white/10 mt-[-20px]">
              <Heading className="text-white text-[32px] font-bold text-center p-0 my-[20px] mx-0 tracking-tight">
                Sorry to see you <span className="text-slate-500">go</span>.
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
                You have been successfully unsubscribed from the Sleads
                newsletter. You will no longer receive updates about our design
                philosophy, tech stack, and new tools.
              </Text>

              <Section className="text-center mt-[40px] mb-[32px]">
                <Link
                  className="bg-transparent border border-slate-700 text-white hover:border-slate-500 rounded-full text-[16px] font-bold no-underline text-center px-8 py-4 inline-block transition-colors"
                  href="https://sleads.nl"
                >
                  Return to Website
                </Link>
              </Section>

              <Hr className="border border-white/10 my-[26px] mx-0 w-full" />

              <Text className="text-sleads-text text-[12px] leading-[20px] text-center">
                If this was a mistake, you can always subscribe again on our
                website.
              </Text>

              <Text className="text-sleads-text text-[12px] leading-[20px] text-center opacity-50">
                © 2026 Sleads. Made in the future.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function renderUnsubscribeEmail(props: UnsubscribeNewsletterProps) {
  return render(<UnsubscribeNewsletter {...props} />);
}

export default UnsubscribeNewsletter;
