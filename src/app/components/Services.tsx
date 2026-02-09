import React from "react";
import { motion } from "framer-motion";
import { Layout, Database, Workflow, PenTool } from "lucide-react";
import { Section } from "./ui/Section";
import { useApp } from "../contexts/AppContext";

export const Services: React.FC = () => {
  const { t } = useApp();

  const services = [
    {
      title: t("services.s1_title"),
      description: t("services.s1_desc"),
      icon: <Layout className="w-8 h-8 text-sleads-blue" />,
      color: "group-hover:text-sleads-blue",
    },
    {
      title: t("services.s2_title"),
      description: t("services.s2_desc"),
      icon: <Database className="w-8 h-8 text-sleads-blue" />,
      color: "group-hover:text-sleads-blue",
    },
    {
      title: t("services.s3_title"),
      description: t("services.s3_desc"),
      // Changed from Aqua to Blue
      icon: <Workflow className="w-8 h-8 text-sleads-blue" />,
      color: "group-hover:text-sleads-blue",
    },
    {
      title: t("services.s4_title"),
      description: t("services.s4_desc"),
      // Changed from Coral to Blue
      icon: <PenTool className="w-8 h-8 text-sleads-blue" />,
      color: "group-hover:text-sleads-blue",
    },
  ];

  return (
    <Section
      id="services"
      className="bg-slate-50 dark:bg-sleads-midnight relative z-10 transition-colors duration-300"
    >
      <div className="mb-20">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="font-heading text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white"
        >
          {t("services.title_1")}
          <br />
          <span className="text-slate-500 dark:text-sleads-slate500">
            {t("services.title_2")}
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-slate-600 dark:text-sleads-slate300 text-lg max-w-xl"
        >
          {t("services.desc")}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.8,
              delay: idx * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative p-8 md:p-12 rounded-3xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 hover:border-slate-300 dark:hover:border-sleads-slate500 transition-colors duration-500 overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:scale-110 group-hover:rotate-6">
              {React.cloneElement(service.icon as React.ReactElement<any>, {
                className: "w-32 h-32",
              })}
            </div>

            <div className="relative z-10">
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-sleads-midnight w-fit border border-slate-200 dark:border-sleads-slate700 group-hover:border-slate-300 dark:group-hover:border-sleads-slate500 transition-colors">
                {service.icon}
              </div>
              <h3
                className={`text-2xl font-bold text-slate-900 dark:text-white mb-3 transition-colors ${service.color}`}
              >
                {service.title}
              </h3>
              <p className="text-slate-600 dark:text-sleads-slate300 leading-relaxed text-base md:text-lg">
                {service.description}
              </p>
            </div>

            {/* Changed gradient from blue-to-aqua to solid blue */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-sleads-blue group-hover:w-full transition-all duration-700 ease-out" />
          </motion.div>
        ))}
      </div>
    </Section>
  );
};
