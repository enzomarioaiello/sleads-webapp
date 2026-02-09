"use client";
import React from "react";
import { motion } from "framer-motion";
import { Home } from "./components/Home";

function Page() {
  return (
    <>
      <motion.div
        key="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Home />
      </motion.div>
    </>
  );
}

export default Page;
