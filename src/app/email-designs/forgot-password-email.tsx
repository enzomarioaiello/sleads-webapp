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

interface ForgotPasswordEmailProps {
  email?: string;
  url?: string;
  name?: string;
  token: string;
}

export const ForgotPasswordEmail = ({
  email,
  name,
  url,
  token,
}: ForgotPasswordEmailProps) => {
  const previewText = "Reset your password for your Sleads account";

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
              backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
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
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-75" />
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
                Reset your password
              </Heading>

              <Text className="text-sleads-text text-[16px] leading-[26px] text-center mb-4">
                {name ? (
                  <>
                    Hi <span className="text-white font-medium">{name}</span>,
                  </>
                ) : (
                  "Hi there,"
                )}
                {!name && email && (
                  <>
                    Hi <span className="text-white font-medium">{email}</span>,
                  </>
                )}
              </Text>

              <Text className="text-sleads-text text-[15px] leading-[24px] text-center mb-6">
                You recently requested to reset your password for your{" "}
                <span className="text-white font-medium">Sleads</span> account.
                Click the button below to reset it.
              </Text>

              <Section className="text-center mt-[24px] mb-[24px]">
                <Link
                  className="bg-[#3B82F6] text-white rounded-full text-[16px] font-bold no-underline text-center px-10 py-4 inline-block shadow-[0_4px_30px_-5px_rgba(59,130,246,0.6)] border border-white/10"
                  href={
                    url?.includes("sleads.nl")
                      ? `https://sleads.nl/reset-password?token=${token}`
                      : `http://localhost:3000/reset-password?token=${token}`
                  }
                >
                  Reset password
                </Link>
              </Section>

              <Text className="text-sleads-text text-[12px] leading-[20px] text-center mb-4">
                If the button above doesn&apos;t work, copy and paste this link
                into your browser:
              </Text>

              <Text className="text-[12px] leading-[18px] text-center break-all text-sleads-text mb-6">
                {url?.includes("sleads.nl")
                  ? `https://sleads.nl/reset-password?token=${token}`
                  : `http://localhost:3000/reset-password?token=${token}`}
              </Text>

              <Hr className="border border-white/10 my-[20px] mx-0 w-full" />

              <Text className="text-sleads-text text-[12px] leading-[18px] text-center">
                This link will expire in 24 hours. If you didn&apos;t request a
                password reset, you can safely ignore this email and no changes
                will be made.
              </Text>

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

export function renderForgotPasswordEmail(props: ForgotPasswordEmailProps) {
  return render(<ForgotPasswordEmail {...props} />);
}

export default ForgotPasswordEmail;
