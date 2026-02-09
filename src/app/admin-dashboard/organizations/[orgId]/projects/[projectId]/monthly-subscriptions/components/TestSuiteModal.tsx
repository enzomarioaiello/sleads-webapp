"use client";

import React, { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { Modal } from "@/app/admin-dashboard/components/ui/Modal";
import { Button } from "@/app/admin-dashboard/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type TestResult = {
  testName: string;
  category: string;
  passed: boolean;
  scenario: string;
  expected: {
    invoiceCreated: boolean;
    itemCount?: number;
    quantities?: number[];
    prices?: number[];
    totalAmount?: number;
    discountApplied?: boolean;
    subscriptionStatus?: string;
    lastInvoiceDate?: number;
    billingCycle?: number;
    [key: string]: unknown;
  };
  actual: {
    invoiceCreated: boolean;
    invoiceId?: string;
    itemCount?: number;
    items?: Array<{
      name: string;
      quantity: number;
      priceExclTax: number;
      description: string;
    }>;
    totalAmount?: number;
    discountApplied?: boolean;
    subscriptionStatus?: string;
    lastInvoiceDate?: number;
    billingCycle?: number;
    [key: string]: unknown;
  };
  error?: string;
  details?: {
    subscriptionIds?: string[];
    invoiceId?: string | null;
    billingCycle?: number;
  };
};

type TestSuiteResult = {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTime: number;
  results: TestResult[];
};

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  organizationId: Id<"organizations">;
}

export function TestSuiteModal({
  isOpen,
  onClose,
  projectId,
  organizationId,
}: TestSuiteModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuiteResult | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "passed" | "failed" | string>(
    "all"
  );
  const [selectedBillingFrequency, setSelectedBillingFrequency] = useState<
    "monthly" | "quarterly" | "semiannually" | "yearly" | undefined
  >(undefined);

  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId,
  });

  const runTests = useAction(
    api.monthlysubscriptionstest.runComprehensiveInvoiceTests
  );

  // Set default billing frequency from project when it loads
  useEffect(() => {
    if (project?.monthlySubscriptionType && !selectedBillingFrequency) {
      setSelectedBillingFrequency(project.monthlySubscriptionType);
    }
  }, [project, selectedBillingFrequency]);

  const handleRunTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    try {
      const results = await runTests({
        projectId,
        organizationId,
        cleanup: false,
        billingFrequency: selectedBillingFrequency,
      });
      setTestResults(results);
    } catch (error) {
      console.error("Test execution failed:", error);
      setTestResults({
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        executionTime: 0,
        results: [
          {
            testName: "Test Execution Error",
            category: "System",
            passed: false,
            scenario: `Failed to execute tests: ${error instanceof Error ? error.message : "Unknown error"}`,
            expected: { invoiceCreated: false },
            actual: { invoiceCreated: false },
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const toggleTestExpansion = (testName: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName);
    } else {
      newExpanded.add(testName);
    }
    setExpandedTests(newExpanded);
  };

  const filteredResults = testResults
    ? testResults.results.filter((result) => {
        if (filter === "all") return true;
        if (filter === "passed") return result.passed;
        if (filter === "failed") return !result.passed;
        return result.category === filter;
      })
    : [];

  const categories = testResults
    ? Array.from(new Set(testResults.results.map((r) => r.category)))
    : [];

  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Suite Results"
      size="lg"
    >
      <div className="space-y-4">
        {!testResults && !isRunning && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Run comprehensive tests to validate all edge cases in the monthly
              subscription invoicing system.
            </p>
            <div className="mb-4 flex flex-col items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Billing Cycle for Tests
              </label>
              <Select
                value={
                  selectedBillingFrequency ||
                  project?.monthlySubscriptionType ||
                  "quarterly"
                }
                onValueChange={(value) => {
                  setSelectedBillingFrequency(
                    value as "monthly" | "quarterly" | "semiannually" | "yearly"
                  );
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semiannually">Semi-annually</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {project?.monthlySubscriptionType
                  ? `Project default: ${project.monthlySubscriptionType}`
                  : "Select a billing cycle to test"}
              </p>
            </div>
            <Button
              onClick={handleRunTests}
              variant="primary"
              disabled={
                !selectedBillingFrequency && !project?.monthlySubscriptionType
              }
            >
              Run Test Suite
            </Button>
          </div>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">
              Running tests... This may take a minute.
            </p>
          </div>
        )}

        {testResults && (
          <>
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Summary</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    testResults.success
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {testResults.passedTests}/{testResults.totalTests} passed
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Tests:</span>
                  <span className="ml-2 font-medium">
                    {testResults.totalTests}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Passed:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {testResults.passedTests}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Failed:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {testResults.failedTests}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Execution time: {formatExecutionTime(testResults.executionTime)}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "all"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({testResults.totalTests})
              </button>
              <button
                onClick={() => setFilter("passed")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "passed"
                    ? "bg-green-100 text-green-700 font-medium"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Passed ({testResults.passedTests})
              </button>
              <button
                onClick={() => setFilter("failed")}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === "failed"
                    ? "bg-red-100 text-red-700 font-medium"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Failed ({testResults.failedTests})
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === category
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Test Results */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredResults.map((result, index) => {
                const isExpanded = expandedTests.has(result.testName);
                return (
                  <div
                    key={index}
                    className={`border rounded-lg ${
                      result.passed
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <button
                      onClick={() => toggleTestExpansion(result.testName)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-opacity-80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {result.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {result.testName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.category}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                        {/* Scenario */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Scenario
                          </h4>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                            {result.scenario}
                          </p>
                        </div>

                        {/* Expected vs Actual */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-green-700 mb-2">
                              Expected
                            </h4>
                            <div className="bg-white p-3 rounded border border-green-200 text-sm font-mono overflow-x-auto">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(result.expected, null, 2)}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-700 mb-2">
                              Actual
                            </h4>
                            <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono overflow-x-auto">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(result.actual, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Error */}
                        {result.error && (
                          <div>
                            <h4 className="font-medium text-red-700 mb-2">
                              Error
                            </h4>
                            <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                              {result.error}
                            </div>
                          </div>
                        )}

                        {/* Details */}
                        {result.details && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Details
                            </h4>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              {result.details.invoiceId && (
                                <div className="mb-1">
                                  <span className="font-medium">
                                    Invoice ID:
                                  </span>{" "}
                                  {result.details.invoiceId}
                                </div>
                              )}
                              {result.details.subscriptionIds &&
                                result.details.subscriptionIds.length > 0 && (
                                  <div className="mb-1">
                                    <span className="font-medium">
                                      Subscription IDs:
                                    </span>{" "}
                                    {result.details.subscriptionIds.join(", ")}
                                  </div>
                                )}
                              {result.details.billingCycle !== undefined && (
                                <div>
                                  <span className="font-medium">
                                    Billing Cycle:
                                  </span>{" "}
                                  {result.details.billingCycle}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={handleRunTests}
                variant="secondary"
                disabled={isRunning}
              >
                Run Again
              </Button>
              <Button onClick={onClose} variant="primary">
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
