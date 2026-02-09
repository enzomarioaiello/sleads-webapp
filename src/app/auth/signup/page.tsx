import React from "react";
import { Metadata } from "next";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign Up | Sleads",
  description:
    "Create a new Sleads account to start building your premium digital experience.",
  alternates: {
    canonical: "/auth/signup",
  },
};

export default function SignUpPage() {
  return <SignUpClient />;
}
