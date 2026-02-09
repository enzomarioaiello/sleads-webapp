import React from "react";
import { motion } from "framer-motion";
import { Section } from "./ui/Section";
import { MessageSquare, FileText, CheckCircle, Clock } from "lucide-react";
import { useApp } from "../contexts/AppContext";

export const Dashboard: React.FC = () => {
  const { t } = useApp();

  return (
    <Section className="py-32 bg-slate-50 dark:bg-transparent transition-colors duration-300">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-1/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
              {t("dashboard.title_1")}
              <br />
              <span className="text-sleads-blue">{t("dashboard.title_2")}</span>
            </h2>
            <p className="text-slate-600 dark:text-sleads-slate300 mb-8 leading-relaxed">
              {t("dashboard.desc")}
            </p>
            <ul className="space-y-4">
              {[
                t("dashboard.li1"),
                t("dashboard.li2"),
                t("dashboard.li3"),
                t("dashboard.li4"),
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-800 dark:text-sleads-slate100"
                >
                  <CheckCircle className="w-5 h-5 text-sleads-blue dark:text-sleads-blue" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="w-full lg:w-2/3 perspective-1000">
          <motion.div
            initial={{ rotateX: 10, rotateY: -10, opacity: 0 }}
            whileInView={{ rotateX: 0, rotateY: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            viewport={{ margin: "-100px" }}
            className="relative rounded-xl bg-white dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 shadow-2xl overflow-hidden aspect-video"
          >
            {/* Fake Browser Header */}
            <div className="h-10 bg-slate-100 dark:bg-sleads-slate900 border-b border-slate-200 dark:border-sleads-slate700 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-sleads-blue/20"></div>
              <div className="w-3 h-3 rounded-full bg-sleads-blue/20"></div>
              <div className="w-3 h-3 rounded-full bg-sleads-blue/20"></div>
              <div className="ml-4 px-3 py-1 bg-white dark:bg-sleads-midnight rounded text-xs text-slate-400 dark:text-sleads-slate500 font-mono">
                portal.sleads.nl/project/alpha
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-16 md:w-48 bg-slate-50 dark:bg-sleads-slate900/50 border-r border-slate-200 dark:border-sleads-slate700 p-4 flex flex-col gap-4">
                <div className="h-8 w-8 bg-sleads-blue rounded-lg mb-8"></div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-sleads-slate700 rounded hidden md:block"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-sleads-slate700 rounded hidden md:block"></div>
                <div className="h-4 w-24 bg-slate-200 dark:bg-sleads-slate700 rounded hidden md:block"></div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 md:p-8 bg-white dark:bg-sleads-midnight">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      Project Alpha
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-sleads-slate500">
                      {t("dashboard.mock_updated")}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 dark:bg-sleads-blue/10 text-sleads-blue dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-sleads-blue/20">
                    {t("dashboard.mock_status")}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-sleads-slate900 p-4 rounded-xl border border-slate-100 dark:border-sleads-slate700">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-sleads-blue" />
                      <span className="text-xs text-slate-500 dark:text-sleads-slate300">
                        {t("dashboard.mock_phase")}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-sleads-slate700 rounded-full mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "75%" }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-sleads-blue"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-sleads-slate900 p-4 rounded-xl border border-slate-100 dark:border-sleads-slate700">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-sleads-blue" />
                      <span className="text-xs text-slate-500 dark:text-sleads-slate300">
                        {t("dashboard.mock_comments")}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      3
                    </div>
                  </div>
                </div>

                {/* Mock Chart */}
                <div className="h-32 w-full bg-slate-50 dark:bg-sleads-slate900 rounded-xl border border-slate-100 dark:border-sleads-slate700 relative overflow-hidden flex items-end justify-between px-4 pb-0 pt-8 gap-2">
                  {[40, 70, 50, 90, 60, 80, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="w-full bg-gradient-to-t from-sleads-blue/20 to-sleads-blue/50 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
};
