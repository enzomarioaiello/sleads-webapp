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

interface ContactProjectRequestEmailProps {
  name: string;
  email: string;
  subject: string;
  companyName: string;
  phone: string;
  message: string;
}

export const ContactProjectRequestEmail = ({
  name,
  email,
  subject,
  companyName,
  phone,
  message,
}: ContactProjectRequestEmailProps) => {
  const previewText = "We received your project request - Sleads";

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
          <Container className="my-[40px] mx-auto max-w-[560px]">
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
                Project Request Received
              </Heading>

              <Text className="text-sleads-text text-[16px] leading-[26px] text-center mb-6">
                Hi <span className="text-white font-medium">{name}</span>,
                thanks for considering Sleads for your project! We have received
                your request and are excited to review it. We&apos;ll get back
                to you within{" "}
                <span className="text-white font-medium">24 hours</span> to
                discuss the details.
              </Text>

              <Section className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
                <Text className="text-xs font-bold text-sleads-blue uppercase tracking-wider mb-2">
                  Project Details
                </Text>
                <Text className="text-white text-[15px] font-medium leading-[24px] m-0 mb-4">
                  {subject}
                </Text>

                <Text className="text-xs font-bold text-sleads-blue uppercase tracking-wider mb-2">
                  Message
                </Text>
                <Text className="text-sleads-text text-[14px] leading-[24px] m-0 whitespace-pre-wrap mb-4">
                  {message}
                </Text>

                <Hr className="border-white/10 my-4" />

                <Row className="mb-4">
                  <Column>
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                      Company
                    </Text>
                    <Text className="text-white text-[13px] m-0">
                      {companyName}
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                      Phone
                    </Text>
                    <Text className="text-white text-[13px] m-0">{phone}</Text>
                  </Column>
                </Row>

                <Row>
                  <Column>
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                      Email
                    </Text>
                    <Text className="text-white text-[13px] m-0">{email}</Text>
                  </Column>
                  <Column align="right">
                    <Text className="text-xs font-bold text-sleads-text uppercase tracking-wider m-0 mb-1">
                      Date
                    </Text>
                    <Text className="text-white text-[13px] m-0">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section className="text-center mt-[24px] mb-[24px]">
                <Link
                  className="bg-[#3B82F6] text-white rounded-full text-[16px] font-bold no-underline text-center px-8 py-3 inline-block shadow-[0_4px_30px_-5px_rgba(59,130,246,0.6)] border border-white/10 hover:bg-[#2563EB] transition-colors"
                  href="https://sleads.nl"
                >
                  Visit Website
                </Link>
              </Section>

              <Hr className="border border-white/10 my-[20px] mx-0 w-full" />

              <Text className="text-sleads-text text-[11px] leading-[18px] text-center opacity-60 mt-6">
                © {new Date().getFullYear()} Sleads. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function renderContactProjectRequestEmail(
  props: ContactProjectRequestEmailProps
) {
  return render(<ContactProjectRequestEmail {...props} />);
}

export default ContactProjectRequestEmail;
