import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleDashed,
  Cpu,
  Database,
  FileJson2,
  FileUp,
  FileText,
  Filter,
  Gauge,
  Landmark,
  Layers3,
  PanelRightOpen,
  ShieldAlert,
  Receipt,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import SidebarNav from "./components/SidebarNav";
import TopNav from "./components/TopNav";
import SectionWrapper from "./components/SectionWrapper";
import StatCard from "./components/StatCard";
import Badge from "./components/Badge";
import DataTable from "./components/DataTable";
import FindingsTable from "./components/FindingsTable";
import { hyperApiService } from "./services";
import {
  documents as fallbackDocuments,
  findings as fallbackFindings,
  navItems,
  stats,
  vendorMaster as fallbackVendorMaster,
} from "./data/mockData";
import { fetchBootstrapData, runAuditRequest } from "./lib/api";

const vendorColumns = [
  {
    key: "vendorName",
    label: "Vendor Name",
    width: "28%",
    headerClassName: "min-w-[220px]",
    cellClassName: "min-w-0 pr-2 text-slate-100",
  },
  {
    key: "gstin",
    label: "GSTIN",
    width: "19%",
    headerClassName: "whitespace-nowrap",
    cellClassName: "whitespace-nowrap text-xs font-medium tracking-[0.08em] text-slate-300",
  },
  {
    key: "ifsc",
    label: "IFSC",
    width: "16%",
    headerClassName: "whitespace-nowrap",
    cellClassName: "whitespace-nowrap text-xs font-medium tracking-[0.08em] text-slate-300",
  },
  {
    key: "state",
    label: "State",
    width: "17%",
    headerClassName: "whitespace-nowrap",
    cellClassName: "whitespace-nowrap text-slate-300",
  },
  {
    key: "validationStatus",
    label: "Validation Status",
    width: "20%",
    headerClassName: "whitespace-nowrap text-center",
    cellClassName: "whitespace-nowrap text-center",
  },
];

const vendorSummaryCards = [
  {
    label: "Total registered vendors",
    value: "1,204",
    tone: "blue",
    detail: "Master entities available for validation and lookup.",
  },
  {
    label: "GSTIN mismatches found",
    value: "14",
    tone: "amber",
    detail: "Tax identities diverge from the authoritative vendor record.",
  },
  {
    label: "IFSC mismatches found",
    value: "9",
    tone: "amber",
    detail: "Bank routing details conflict with approved payout configuration.",
  },
  {
    label: "Fake vendor alerts",
    value: "3",
    tone: "rose",
    detail: "Suspicious entities show abnormal patterns or unverifiable references.",
  },
];

const findingTabs = ["Easy", "Medium", "Evil"];
const heroStats = [
  { value: "1000+", label: "pages processed", icon: FileUp, tone: "blue", position: "lg:absolute lg:left-2 lg:top-4" },
  { value: "200+", label: "hidden needles", icon: Sparkles, tone: "rose", position: "lg:absolute lg:right-3 lg:top-14" },
  { value: "20", label: "needle categories", icon: BrainCircuit, tone: "violet", position: "lg:absolute lg:left-8 lg:bottom-20" },
  { value: "JSON-ready", label: "findings export", icon: FileJson2, tone: "emerald", position: "lg:absolute lg:right-2 lg:bottom-5" },
];

const featureStrip = [
  { label: "Arithmetic validation", icon: TrendingUp },
  { label: "Vendor master reconciliation", icon: ShieldCheck },
  { label: "PO vs invoice matching", icon: Receipt },
  { label: "Bank statement consistency", icon: Wallet },
  { label: "Duplicate expense detection", icon: Search },
];
const pipelineSteps = [
  "PDF uploaded",
  "Vendor Master indexed",
  "Documents classified",
  "Fields extracted",
  "Needle detection completed",
  "JSON prepared",
];

const documentSummary = [
  { label: "Invoices found", value: "442", icon: Receipt, tone: "blue" },
  { label: "Purchase orders found", value: "276", icon: Database, tone: "amber" },
  { label: "Bank statements found", value: "218", icon: Wallet, tone: "rose" },
  { label: "Expense reports found", value: "348", icon: Zap, tone: "emerald" },
  { label: "Credit/debit notes found", value: "63", icon: FileText, tone: "violet" },
];
const vendorStatusFilters = ["All", "Valid", "Mismatch", "Suspicious"];
const documentTypeFilters = [
  "All",
  "Invoice",
  "Purchase Order",
  "Bank Statement",
  "Expense Report",
  "Credit Note",
  "Debit Note",
  "Receipt",
  "Quotation",
];
const documentRiskFilters = ["All", "Low", "Medium", "High"];
const riskBadgeTone = {
  Low: "emerald",
  Medium: "amber",
  High: "rose",
  Critical: "rose",
};
const officialNeedleCategories = {
  Easy: ["arithmetic_error", "billing_typo", "duplicate_line_item", "invalid_date", "wrong_tax_rate"],
  Medium: [
    "po_invoice_mismatch",
    "vendor_name_typo",
    "double_payment",
    "ifsc_mismatch",
    "duplicate_expense",
    "date_cascade",
    "gstin_state_mismatch",
  ],
  Evil: [
    "quantity_accumulation",
    "price_escalation",
    "balance_drift",
    "circular_reference",
    "triple_expense_claim",
    "employee_id_collision",
    "fake_vendor",
    "phantom_po_reference",
  ],
};
const pointsByDifficulty = {
  Easy: 100,
  Medium: 250,
  Evil: 500,
};
const severityRank = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};
const scoringWeights = {
  Easy: 1,
  Medium: 3,
  Evil: 7,
};
const whyItWorks = [
  {
    title: "Vendor Master as source of truth",
    description: "Tax identity, IFSC, state, and entity trust signals anchor every downstream validation path.",
    icon: Landmark,
  },
  {
    title: "Single-document checks",
    description: "Invoices, receipts, debit notes, and statements are parsed for arithmetic, date, and field-level drift.",
    icon: FileText,
  },
  {
    title: "Cross-document validation",
    description: "POs, invoices, bank trails, and expenses are reconciled across linked references to expose inconsistencies.",
    icon: ShieldCheck,
  },
  {
    title: "Multi-document aggregation for evil needles",
    description: "Higher-order fraud patterns are surfaced only after evidence accumulates across document families and payment chains.",
    icon: BrainCircuit,
  },
  {
    title: "Exact JSON export for submission",
    description: "Displayed findings normalize into the official payload shape with strict category strings and array fields.",
    icon: FileJson2,
  },
];

const demoFlow = [
  { label: "Upload", detail: "Bring in the financial PDF bundle", icon: UploadCloud },
  { label: "Classify", detail: "Split into invoices, POs, statements, and more", icon: Layers3 },
  { label: "Extract", detail: "Pull dates, values, line items, and references", icon: Cpu },
  { label: "Validate", detail: "Cross-check against Vendor Master and linked docs", icon: ShieldEllipsis },
  { label: "Detect", detail: "Generate rule-driven needles across difficulty tiers", icon: Sparkles },
  { label: "Export", detail: "Package findings into submission JSON", icon: FileJson2 },
];

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [documentsData, setDocumentsData] = useState(fallbackDocuments);
  const [vendorMasterData, setVendorMasterData] = useState(fallbackVendorMaster);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("All");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All");
  const [documentRiskFilter, setDocumentRiskFilter] = useState("All");
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeFindingTab, setActiveFindingTab] = useState("Easy");
  const [findingCategoryFilter, setFindingCategoryFilter] = useState("All");
  const [findingSort, setFindingSort] = useState("severity");
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [currentFindings, setCurrentFindings] = useState(fallbackFindings);
  const [scoreDifficulty, setScoreDifficulty] = useState("Medium");
  const [scoreInputs, setScoreInputs] = useState({
    matchedCategory: true,
    correctPages: true,
    reportedValue: false,
    correctValue: true,
  });
  const [teamId, setTeamId] = useState("your_team_name");
  const [copyStatus, setCopyStatus] = useState("idle");
  const [hyperApiStatus, setHyperApiStatus] = useState("idle");
  const [hyperApiMessage, setHyperApiMessage] = useState("");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem("finneedle-theme") ?? "dark";
  });
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("finneedle-theme", theme);
  }, [theme]);

  useEffect(() => {
    const sections = navItems.map((item) => document.getElementById(item.id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { threshold: [0.25, 0.45, 0.7] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    fetchBootstrapData()
      .then((payload) => {
        if (!active) {
          return;
        }

        setDocumentsData(payload.documents ?? fallbackDocuments);
        setVendorMasterData(payload.vendorMaster ?? fallbackVendorMaster);
        setCurrentFindings(payload.findings ?? fallbackFindings);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setDocumentsData(fallbackDocuments);
        setVendorMasterData(fallbackVendorMaster);
        setCurrentFindings(fallbackFindings);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!auditRunning) {
      return undefined;
    }

    if (pipelineProgress >= pipelineSteps.length) {
      const timer = window.setTimeout(() => {
        runAuditRequest({
          datasetName: uploadedFile?.name ?? "global_audit_financial_dump.pdf",
        })
          .then((auditResult) => {
            setDocumentsData(auditResult.parsedDocuments ?? fallbackDocuments);
            setCurrentFindings(auditResult.findings ?? fallbackFindings);
          })
          .catch(() => {
            setDocumentsData(fallbackDocuments);
            setCurrentFindings(fallbackFindings);
          })
          .finally(() => {
            setAuditRunning(false);
            setAuditBusy(false);
          });
      }, 700);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setPipelineProgress((current) => Math.min(current + 1, pipelineSteps.length));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [auditRunning, pipelineProgress, uploadedFile?.name]);

  const filteredFindings = useMemo(() => {
    return currentFindings
      .filter((item) => item.difficulty === activeFindingTab)
      .filter((item) => findingCategoryFilter === "All" || item.category === findingCategoryFilter)
      .sort((left, right) => {
        if (findingSort === "confidence") {
          return right.confidence - left.confidence;
        }

        return severityRank[right.severity] - severityRank[left.severity];
      });
  }, [activeFindingTab, currentFindings, findingCategoryFilter, findingSort]);

  const filteredVendors = useMemo(() => {
    return vendorMasterData.filter((vendor) => {
      const matchesFilter = vendorStatusFilter === "All" || vendor.validationStatus === vendorStatusFilter;
      const query = vendorSearchTerm.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        vendor.vendorName.toLowerCase().includes(query) ||
        vendor.gstin.toLowerCase().includes(query) ||
        vendor.ifsc.toLowerCase().includes(query) ||
        vendor.state.toLowerCase().includes(query);

      return matchesFilter && matchesQuery;
    });
  }, [vendorMasterData, vendorSearchTerm, vendorStatusFilter]);

  const filteredDocuments = useMemo(() => {
    return documentsData.filter((document) => {
      const matchesType = documentTypeFilter === "All" || document.type === documentTypeFilter;
      const matchesRisk = documentRiskFilter === "All" || document.riskLevel === documentRiskFilter;
      const query = documentSearchTerm.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        document.docId.toLowerCase().includes(query) ||
        document.type.toLowerCase().includes(query) ||
        document.vendor.toLowerCase().includes(query);

      return matchesType && matchesRisk && matchesQuery;
    });
  }, [documentTypeFilter, documentRiskFilter, documentSearchTerm, documentsData]);

  const selectFile = (file) => {
    if (!file) {
      setAuditRunning(false);
      setAuditBusy(false);
      return;
    }

    setUploadedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      status: "Uploaded",
    });
    setPipelineProgress(1);
    setAuditRunning(false);
    setAuditBusy(false);
    setCurrentFindings([]);
    setHyperApiStatus("idle");
    setHyperApiMessage("");
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    selectFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    selectFile(file);
  };

  const handleRunAudit = () => {
    if (!uploadedFile) {
      return;
    }

    setSelectedFinding(null);
    setAuditBusy(true);
    setPipelineProgress((current) => Math.max(current, 1));
    setAuditRunning(true);
    setHyperApiStatus("loading");
    setHyperApiMessage("Sending audit request to Hyper API...");

    hyperApiService
      .submitAudit({
        datasetName: uploadedFile.name,
        datasetSize: uploadedFile.size,
        teamId,
        documentCounts: {
          invoices: documentSummary[0]?.value,
          purchaseOrders: documentSummary[1]?.value,
          bankStatements: documentSummary[2]?.value,
          expenseReports: documentSummary[3]?.value,
          creditDebitNotes: documentSummary[4]?.value,
        },
      })
      .then(() => {
        setHyperApiStatus("success");
        setHyperApiMessage("Hyper API received the audit request successfully.");
      })
      .catch((error) => {
        setHyperApiStatus("error");
        setHyperApiMessage(error instanceof Error ? error.message : "Hyper API request failed.");
      });
  };

  const completedSteps = uploadedFile ? Math.min(pipelineProgress, pipelineSteps.length) : 0;
  const overallProgress = uploadedFile ? Math.round((completedSteps / pipelineSteps.length) * 100) : 0;
  const findingSummaryCards = findingTabs.map((difficulty) => {
    const count = currentFindings.filter((item) => item.difficulty === difficulty).length;
    return {
      difficulty,
      count,
      points: count * pointsByDifficulty[difficulty],
    };
  });
  const detectionScore = scoreInputs.matchedCategory ? 1 : 0;
  const localizationScore = scoreInputs.correctPages ? 1 : 0;
  const diagnosisScore = (Number(scoreInputs.reportedValue) + Number(scoreInputs.correctValue)) / 2;
  const rawNeedleScore =
    scoringWeights[scoreDifficulty] *
    (0.4 * detectionScore + 0.3 * localizationScore + 0.3 * diagnosisScore);
  const falsePositivePenalty = Math.min(0.5, rawNeedleScore * 0.2);
  const estimatedScore = Math.max(rawNeedleScore - (scoreInputs.matchedCategory ? 0 : falsePositivePenalty), 0);
  const submissionFindings = filteredFindings.map((item) => ({
    finding_id: item.finding_id,
    category: item.category,
    pages: item.pages.split(",").flatMap((part) => {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((value) => Number.parseInt(value.trim(), 10));
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
          return [];
        }

        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
      }

      const page = Number.parseInt(trimmed, 10);
      return Number.isNaN(page) ? [] : [page];
    }),
    document_refs: item.document_refs.split(",").map((ref) => ref.trim()).filter(Boolean),
    description: item.why_detected,
    reported_value: item.reported_value.replace(/[$,%]/g, "").replaceAll(",", ""),
    correct_value: item.correct_value.replace(/[$,%]/g, "").replaceAll(",", ""),
  }));
  const exportPayload = {
    team_id: teamId,
    findings: submissionFindings,
  };
  const exportWarnings = [
    ...(teamId.trim().length === 0 ? ["team_id is required."] : []),
    ...(submissionFindings.length === 0 ? ["No findings available. Run Audit to generate submission data."] : []),
    ...submissionFindings.flatMap((item) => {
      const warnings = [];
      if (!item.finding_id) warnings.push(`${item.category}: finding_id is missing.`);
      if (!item.category || !Object.values(officialNeedleCategories).flat().includes(item.category)) {
        warnings.push(`${item.finding_id || "finding"}: category must be an official exact string.`);
      }
      if (item.pages.length === 0) warnings.push(`${item.finding_id}: pages must contain at least one page number.`);
      if (item.document_refs.length === 0) warnings.push(`${item.finding_id}: document_refs must contain at least one reference.`);
      if (!item.description) warnings.push(`${item.finding_id}: description is required.`);
      if (item.reported_value.length === 0) warnings.push(`${item.finding_id}: reported_value is required.`);
      if (item.correct_value.length === 0) warnings.push(`${item.finding_id}: correct_value is required.`);
      return warnings;
    }),
  ];

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${teamId.trim() || "finneedle"}-submission.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell relative min-h-screen overflow-x-hidden" data-theme={theme}>
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:72px_72px] opacity-30" />
      <div className="mx-auto w-full max-w-[1780px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 xl:px-7 2xl:px-8">
        <div className="grid items-start gap-4 lg:grid-cols-[15.75rem_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[16.75rem_minmax(0,1fr)] xl:gap-5">
        <SidebarNav
          items={navItems}
          activeSection={activeSection}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <TopNav
            items={navItems}
            theme={theme}
            onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          />

          <section
            id="hero"
            className="section-anchor relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/95 to-indigo-950/80 p-5 shadow-soft sm:p-7 lg:p-8 xl:p-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_25%),radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.22),transparent_32%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
            <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1.14fr)_minmax(360px,0.86fr)] xl:items-center">
              <div className="min-w-0 xl:pr-2">
                <Badge tone="blue">AI-powered financial document investigation</Badge>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.3rem] xl:leading-[1.02]">
                  Detect hidden issues in financial documents before they become missed audit risks.
                </h1>
                <p className="mt-6 max-w-[46rem] text-base leading-8 text-slate-300 sm:text-lg">
                  FinNeedle AI cross-checks invoices, purchase orders, bank statements, expense reports, and vendor
                  master data to surface arithmetic errors, duplicate claims, reconciliation gaps, and planted fraud
                  needles in one review flow.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#upload"
                    className="interactive-pill inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
                  >
                    Upload Dataset
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#findings"
                    className="interactive-pill inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View Findings
                    <Search className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-8 grid max-w-[44rem] gap-3 sm:grid-cols-3">
                  {[
                    { value: "1.2k+", label: "documents indexed" },
                    { value: "37", label: "flagged findings" },
                    { value: "91%", label: "cross-linked records" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
                      <p className="text-2xl font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-w-0 xl:max-w-[41rem]">
                <div className="glass-panel relative overflow-hidden rounded-[32px] border-white/15 p-5 sm:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.22),transparent_36%)]" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Detection Graph</p>
                        <p className="mt-2 text-2xl font-semibold text-white">Live audit intelligence panel</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Sparkles className="h-5 w-5 text-cyan-300" />
                      </div>
                    </div>

                    <div className="mt-7 rounded-[28px] border border-white/10 bg-slate-950/50 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-400">Cross-document anomaly map</p>
                          <p className="mt-1 text-lg font-medium text-white">Invoices, POs, bank trails, and expenses linked</p>
                        </div>
                        <Badge tone="violet">FinGraph active</Badge>
                      </div>

                      <div className="mt-5 grid grid-cols-6 gap-2.5">
                        {[0.24, 0.4, 0.65, 0.78, 0.55, 0.35, 0.48, 0.9, 0.58, 0.3, 0.86, 0.46].map((opacity, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500"
                            style={{ opacity }}
                          />
                        ))}
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {[
                          { label: "Arithmetic checks", value: "96.8%", tone: "emerald" },
                          { label: "Mismatch clusters", value: "31 active", tone: "amber" },
                          { label: "High-risk needles", value: "8 critical", tone: "rose" },
                          { label: "Export pipeline", value: "JSON-ready", tone: "blue" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-sm text-slate-400">{item.label}</p>
                            <div className="mt-3">
                              <Badge tone={item.tone}>{item.value}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {heroStats.map((item, index) => (
                  <div
                    key={item.label}
                    className={`glass-panel floating-card mt-4 max-w-[220px] rounded-[26px] p-4 sm:p-5 lg:mt-0 ${item.position}`}
                    style={{ animationDelay: `${index * 1.1}s` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold text-white">{item.value}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.label}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <item.icon className="h-5 w-5 text-cyan-300" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Badge tone={item.tone}>Live signal</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8">
              <div className="glass-panel rounded-[30px] px-4 py-4 sm:px-5 lg:px-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {featureStrip.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="rounded-2xl bg-white/10 p-2.5">
                        <item.icon className="h-4 w-4 text-cyan-300" />
                      </div>
                      <span className="text-sm font-medium text-slate-200">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>

          <div className="mt-6 space-y-6">
            <SectionWrapper
              id="upload"
              eyebrow="Ingestion"
              title="Upload Dataset"
              description="Upload a financial PDF, trigger the audit pipeline, and watch FinNeedle AI stage the dataset through indexing, classification, extraction, and fraud-needle detection."
            >
              <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
                <div className="space-y-4">
                  <label
                    className={`glass-panel group flex min-h-[300px] cursor-pointer flex-col justify-between rounded-[32px] border border-dashed p-6 sm:p-7 transition ${
                      isDragActive
                        ? "border-cyan-300/70 bg-cyan-400/10"
                        : "border-cyan-400/30 hover:border-cyan-300/60 hover:bg-white/[0.07]"
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="rounded-3xl bg-cyan-400/10 p-4 transition group-hover:scale-105">
                        <UploadCloud className="h-8 w-8 text-cyan-300" />
                      </div>
                      <Badge tone="blue">Accepted file type: PDF</Badge>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-semibold text-white">Drag and drop your audit dataset</p>
                      <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                        Drop a financial PDF here or browse locally to start the FinNeedle processing pipeline.
                      </p>
                      <span className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100">
                        Choose PDF file
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Pages supported", value: "1000+" },
                        { label: "Processing mode", value: "Mock frontend" },
                        { label: "Output", value: "JSON findings" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
                          <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
                  </label>

                  {uploadedFile ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {documentSummary.map((item) => (
                        <div key={item.label} className="glass-panel rounded-3xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-slate-400">{item.label}</p>
                            <item.icon className="h-4 w-4 text-slate-200" />
                          </div>
                          <p className="mt-4 text-2xl font-semibold text-white">{item.value}</p>
                          <div className="mt-3">
                            <Badge tone={item.tone}>Detected</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <div className="glass-panel rounded-[32px] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-400">Dataset status</p>
                        <p className="mt-2 wrap-anywhere text-xl font-semibold text-white">
                          {uploadedFile ? uploadedFile.name : "Awaiting PDF dataset"}
                        </p>
                      </div>
                      <Badge tone={uploadedFile ? (auditRunning ? "blue" : overallProgress === 100 ? "emerald" : "amber") : "amber"}>
                        {uploadedFile ? (auditRunning ? "Processing" : overallProgress === 100 ? "Completed" : uploadedFile.status) : "Pending"}
                      </Badge>
                    </div>
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex min-w-0 items-center justify-between gap-4 text-sm text-slate-300">
                        <span>Filename</span>
                        <span className="max-w-[60%] truncate text-right">{uploadedFile?.name ?? "global_audit_financial_dump.pdf"}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-300">
                        <span>Size</span>
                        <span>{uploadedFile?.size ?? "84.70 MB"}</span>
                      </div>
                      <div className="mt-3 flex min-w-0 items-center justify-between gap-4 text-sm text-slate-300">
                        <span>Pipeline stage</span>
                        <span className="max-w-[58%] text-right">
                          {uploadedFile
                            ? auditRunning
                              ? pipelineSteps[pipelineProgress] ?? "Finalizing export"
                              : overallProgress === 100
                                ? "Export package ready"
                                : "Ready to run audit"
                            : "Ready to ingest"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
                          <span>Pipeline progress</span>
                          <span>{overallProgress}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-700"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRunAudit}
                      disabled={!uploadedFile || auditRunning || auditBusy}
                      className="interactive-pill mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      {auditRunning || auditBusy ? "Running Audit..." : "Run Audit"}
                    </button>
                    {hyperApiStatus !== "idle" ? (
                      <div
                        className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                          hyperApiStatus === "success"
                            ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-100"
                            : hyperApiStatus === "error"
                              ? "border-rose-400/20 bg-rose-400/5 text-rose-100"
                              : "border-cyan-400/20 bg-cyan-400/5 text-cyan-100"
                        }`}
                      >
                        {hyperApiMessage}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
                    <div className="glass-panel min-w-0 rounded-[32px] p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">Processing pipeline</p>
                          <p className="mt-2 text-lg font-semibold text-white">Document intelligence stages</p>
                        </div>
                        <Badge tone={uploadedFile ? "violet" : "slate"}>{pipelineSteps.length} steps</Badge>
                      </div>
                      <div className="mt-5 grid gap-3">
                        {pipelineSteps.map((step, index) => {
                          const status = !uploadedFile
                            ? "pending"
                            : index < pipelineProgress
                              ? "completed"
                              : index === pipelineProgress && auditRunning
                                ? "processing"
                                : "pending";

                          return (
                            <div
                              key={step}
                              className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)] 2xl:grid-cols-[auto_minmax(0,1fr)_auto] 2xl:items-start"
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                  status === "completed"
                                    ? "bg-emerald-500/15 text-emerald-200"
                                    : status === "processing"
                                      ? "bg-blue-500/15 text-blue-200"
                                      : "bg-white/10 text-slate-400"
                                }`}
                              >
                                {status === "completed" ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : status === "processing" ? (
                                  <CircleDashed className="h-5 w-5 animate-spin" />
                                ) : (
                                  <span className="text-sm font-semibold">{index + 1}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-6 text-slate-100">{step}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{status}</p>
                              </div>
                              <div className="justify-self-start 2xl:justify-self-end">
                                <Badge
                                  tone={
                                    status === "completed" ? "emerald" : status === "processing" ? "blue" : "slate"
                                  }
                                >
                                  {status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="glass-panel min-w-0 rounded-[32px] p-5 sm:p-6">
                      <p className="text-sm text-slate-400">What happens next</p>
                      <div className="mt-5 grid gap-3">
                        {[
                          "Split the uploaded PDF into document families and references",
                          "Cross-link extracted entities against vendor master records",
                          "Surface needle candidates and prepare submission-safe JSON",
                        ].map((step) => (
                          <div
                            key={step}
                            className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl bg-white/[0.03] px-4 py-3"
                          >
                            <div className="rounded-full bg-white/10 p-2 shrink-0">
                              <Sparkles className="h-4 w-4 text-cyan-300" />
                            </div>
                            <span className="min-w-0 text-sm leading-6 text-slate-200">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper
              id="vendors"
              eyebrow="Reference Data"
              title="Vendor Master"
              description="Vendor Master is the authoritative reference used across the pipeline. GSTIN, IFSC, and state-level identities are cross-referenced against it to validate documents, flag mismatches, and surface suspicious entities."
              actions={<Badge tone="violet">Authoritative control record</Badge>}
            >
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.32fr)_minmax(300px,0.82fr)]">
                <div className="min-w-0 space-y-6">
                  <div className="glass-panel rounded-[32px] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-cyan-400/10 p-3">
                            <Landmark className="h-5 w-5 text-cyan-300" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Authoritative vendor registry</p>
                            <p className="text-lg font-semibold text-white">Cross-reference hub for identity and banking checks</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-300">
                          Every invoice, purchase order, bank statement, and expense report is validated against this
                          master to confirm tax identity, bank routing, and vendor legitimacy before a needle is raised.
                        </p>
                      </div>
                      <Badge tone="blue">{filteredVendors.length} vendors in view</Badge>
                    </div>

                    <div className="mt-6 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="glass-panel flex min-w-0 w-full items-center gap-3 rounded-2xl px-4 py-3 xl:max-w-lg">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          value={vendorSearchTerm}
                          onChange={(event) => setVendorSearchTerm(event.target.value)}
                          placeholder="Search vendor name, GSTIN, IFSC, or state"
                          className="min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                        />
                      </div>

                      <div className="flex min-w-0 flex-wrap gap-2.5">
                        {vendorStatusFilters.map((filterValue) => (
                          <button
                            key={filterValue}
                            onClick={() => setVendorStatusFilter(filterValue)}
                            className={`interactive-pill inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                              vendorStatusFilter === filterValue
                                ? "bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950"
                                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <Filter className="h-3.5 w-3.5" />
                            {filterValue}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <DataTable columns={vendorColumns} rows={filteredVendors} />
                    </div>
                  </div>
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    {vendorSummaryCards.map((item) => (
                      <div key={item.label} className="glass-panel min-w-0 rounded-[28px] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm text-slate-400">{item.label}</p>
                            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                          </div>
                          <Badge tone={item.tone}>
                            {item.label.includes("Fake") ? "Suspicious" : item.tone === "blue" ? "Reference" : "Mismatch"}
                          </Badge>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-400">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="glass-panel rounded-[28px] p-5">
                    <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Cross-reference checks</p>
                    <div className="mt-5 space-y-3">
                      {[
                        "Invoice vendor GSTIN must match the registered tax profile",
                        "Bank statements are reconciled against approved IFSC and payout rails",
                        "PO and expense references inherit vendor legitimacy from this master",
                      ].map((item) => (
                        <div key={item} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" />
                          <span className="min-w-0 text-sm text-slate-200">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper
              id="documents"
              eyebrow="Document Intelligence"
              title="Document Explorer"
              description="Inspect parsed documents across the audit dataset, filter by type and risk, and open a structured extracted-field view for deeper investigation."
              actions={<Badge tone="blue">{documentsData.length} parsed documents</Badge>}
            >
              <div className="mb-5 grid gap-4 lg:grid-cols-5">
                {[
                  { label: "Invoices", value: "442", icon: FileUp, tone: "blue" },
                  { label: "Purchase Orders", value: "276", icon: Database, tone: "amber" },
                  { label: "Bank Statements", value: "218", icon: ShieldCheck, tone: "rose" },
                  { label: "Expense Reports", value: "348", icon: Zap, tone: "emerald" },
                  { label: "Traceable links", value: "91%", icon: Layers3, tone: "violet" },
                ].map((item) => (
                  <div key={item.label} className="glass-panel rounded-3xl p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <item.icon className="h-4 w-4 text-slate-200" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold text-white">{item.value}</p>
                    <div className="mt-3">
                      <Badge tone={item.tone}>Mock dataset</Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5 glass-panel rounded-[32px] p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="glass-panel flex min-w-0 w-full items-center gap-3 rounded-2xl px-4 py-3 xl:max-w-md">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={documentSearchTerm}
                      onChange={(event) => setDocumentSearchTerm(event.target.value)}
                      placeholder="Search by document reference"
                      className="min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 xl:items-end">
                    <div className="flex min-w-0 flex-wrap gap-2.5">
                      {documentTypeFilters.map((filterValue) => (
                        <button
                          key={filterValue}
                          onClick={() => setDocumentTypeFilter(filterValue)}
                          className={`interactive-pill inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm transition ${
                            documentTypeFilter === filterValue
                              ? "bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950"
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {filterValue}
                        </button>
                      ))}
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2.5">
                      {documentRiskFilters.map((filterValue) => (
                        <button
                          key={filterValue}
                          onClick={() => setDocumentRiskFilter(filterValue)}
                          className={`interactive-pill inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm transition ${
                            documentRiskFilter === filterValue
                              ? "bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950"
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          Risk: {filterValue}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3.5">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((document) => (
                    <button
                      key={document.docId}
                      onClick={() => setSelectedDocument(document)}
                      className="glass-panel rounded-[30px] p-5 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Document type</p>
                            <p className="mt-2 wrap-anywhere text-lg font-semibold text-white">{document.type}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Reference ID</p>
                            <p className="mt-2 wrap-anywhere text-lg font-semibold text-white">{document.docId}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pages</p>
                            <p className="mt-2 wrap-anywhere text-base text-slate-200">{document.pages}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Linked vendor</p>
                            <p className="mt-2 wrap-anywhere text-base text-slate-200">{document.vendor}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Linked PO</p>
                            <p className="mt-2 wrap-anywhere text-base text-slate-200">{document.linkedPo}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Date</p>
                            <p className="mt-2 wrap-anywhere text-base text-slate-200">{document.date}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                          <Badge tone={riskBadgeTone[document.riskLevel]}>{document.riskLevel} risk</Badge>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                            Open detail
                            <PanelRightOpen className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="glass-panel rounded-[30px] p-8 text-center">
                    <p className="text-lg font-semibold text-white">No documents match these filters</p>
                    <p className="mt-3 text-sm text-slate-400">
                      Adjust the document type, risk level, or reference search to broaden the investigation set.
                    </p>
                  </div>
                )}
              </div>
            </SectionWrapper>

            <SectionWrapper
              id="findings"
              eyebrow="Detection Results"
              title="Findings Dashboard"
              description="Review official needle findings by difficulty, filter to the approved hackathon categories, sort by risk signal, and open a detailed rationale for every detection."
            >
              <div className="mb-5 grid gap-4 md:grid-cols-3">
                {findingSummaryCards.map((item) => (
                  <div key={item.difficulty} className="glass-panel rounded-3xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">{item.difficulty} findings</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{item.count}</p>
                      </div>
                      <Badge tone={item.difficulty === "Easy" ? "emerald" : item.difficulty === "Medium" ? "amber" : "rose"}>
                        {item.points} pts
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      Official {item.difficulty.toLowerCase()} tier findings scored for hackathon submission review.
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-5 glass-panel rounded-[32px] p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-2.5">
                    {findingTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveFindingTab(tab);
                          setFindingCategoryFilter("All");
                        }}
                        className={`interactive-pill inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm transition ${
                          activeFindingTab === tab
                            ? "bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:w-[560px]">
                    <label className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <select
                        value={findingCategoryFilter}
                        onChange={(event) => setFindingCategoryFilter(event.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none"
                      >
                        <option value="All" className="bg-slate-900">
                          All categories
                        </option>
                        {officialNeedleCategories[activeFindingTab].map((category) => (
                          <option key={category} value={category} className="bg-slate-900">
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3">
                      <Layers3 className="h-4 w-4 text-slate-400" />
                      <select
                        value={findingSort}
                        onChange={(event) => setFindingSort(event.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none"
                      >
                        <option value="severity" className="bg-slate-900">
                          Sort by severity
                        </option>
                        <option value="confidence" className="bg-slate-900">
                          Sort by confidence
                        </option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              {auditBusy ? (
                <div className="glass-panel rounded-[32px] p-8">
                  <div className="flex items-center gap-3">
                    <CircleDashed className="h-5 w-5 animate-spin text-cyan-300" />
                    <p className="text-sm text-slate-200">
                      Running mock parsing and rule engine checks across local documents.
                    </p>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {["Parsing documents", "Resolving references", "Generating findings"].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                        <div className="soft-pulse h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                        <p className="mt-3 text-sm text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredFindings.length > 0 ? (
                <FindingsTable rows={filteredFindings} onRowClick={setSelectedFinding} />
              ) : (
                <div className="glass-panel rounded-[32px] p-8 text-center">
                  <p className="text-lg font-semibold text-white">No findings in this view yet</p>
                  <p className="mt-3 text-sm text-slate-400">
                    Run the mock audit or broaden the current difficulty and category filters to populate the dashboard.
                  </p>
                </div>
              )}

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
                <div className="glass-panel rounded-[32px] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Scoring Logic</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">Scoring & Submission Logic</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        Hackathon scoring rewards finding difficulty and how accurately your system detects, localizes,
                        and diagnoses each needle.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-cyan-400/10 p-3">
                      <Gauge className="h-5 w-5 text-cyan-300" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Easy findings", value: "1x", detail: "weight per matched needle", tone: "emerald" },
                      { label: "Medium findings", value: "3x", detail: "weight per matched needle", tone: "amber" },
                      { label: "Evil findings", value: "7x", detail: "weight per matched needle", tone: "rose" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                        <div className="mt-3">
                          <Badge tone={item.tone}>{item.detail}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Detection", value: "0.4", desc: "Matched official category" },
                      { label: "Localization", value: "0.3", desc: "Correct page targeting" },
                      { label: "Diagnosis", value: "0.3", desc: "Reported and corrected values" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                        <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[28px] border border-cyan-400/20 bg-cyan-400/5 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Formula</p>
                    <code className="mt-3 block text-sm leading-7 text-cyan-100">
                      needle_score = difficulty_weight x (0.4 x detection + 0.3 x localization + 0.3 x diagnosis)
                    </code>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-amber-400/20 bg-amber-400/5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-amber-400/10 p-2.5">
                        <ShieldAlert className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">False positive warning</p>
                        <p className="mt-2 text-sm leading-7 text-slate-300">
                          Unmatched findings incur a `-0.5` penalty each, capped at `20%` of earned score. Accurate
                          category matching is the safest way to protect total submission score.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-[32px] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Estimator</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">Interactive score estimator</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        Toggle mock match conditions to estimate how one finding contributes to the final score.
                      </p>
                    </div>
                    <Badge tone="blue">Live mock</Badge>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm text-slate-400">Difficulty weight</p>
                    <div className="flex flex-wrap gap-2.5">
                      {findingTabs.map((difficulty) => (
                        <button
                          key={difficulty}
                          onClick={() => setScoreDifficulty(difficulty)}
                          className={`interactive-pill inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm transition ${
                            scoreDifficulty === difficulty
                              ? "bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950"
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {difficulty} ({scoringWeights[difficulty]}x)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { key: "matchedCategory", label: "Matched category" },
                      { key: "correctPages", label: "Correct pages localized" },
                      { key: "reportedValue", label: "Reported value correct" },
                      { key: "correctValue", label: "Correct value provided" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <span className="text-sm text-slate-200">{item.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setScoreInputs((current) => ({
                              ...current,
                              [item.key]: !current[item.key],
                            }))
                          }
                          className={`relative h-7 w-12 rounded-full transition ${
                            scoreInputs[item.key] ? "bg-cyan-400/70" : "bg-white/10"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                              scoreInputs[item.key] ? "left-6" : "left-1"
                            }`}
                          />
                        </button>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Detection score", value: detectionScore.toFixed(1) },
                      { label: "Localization score", value: localizationScore.toFixed(1) },
                      { label: "Diagnosis score", value: diagnosisScore.toFixed(1) },
                      { label: "Raw needle score", value: rawNeedleScore.toFixed(2) },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Estimated score after penalty logic</p>
                        <p className="mt-2 text-4xl font-semibold text-white">{estimatedScore.toFixed(2)}</p>
                      </div>
                      <Badge tone={scoreInputs.matchedCategory ? "emerald" : "amber"}>
                        {scoreInputs.matchedCategory ? "Matched" : `Penalty: -${falsePositivePenalty.toFixed(2)}`}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      This estimate applies the selected difficulty weight and the current detection, localization, and
                      diagnosis toggles using the hackathon scoring formula.
                    </p>
                  </div>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper
              id="why-it-works"
              eyebrow="Product Logic"
              title="Why It Works"
              description="FinNeedle AI combines trusted reference data, document intelligence, and cross-record reasoning so the demo feels like a credible fintech audit product."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {whyItWorks.map((item) => (
                  <div key={item.title} className="glass-panel surface-hover rounded-[30px] p-5">
                    <div className="rounded-2xl bg-cyan-400/10 p-3 w-fit">
                      <item.icon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </SectionWrapper>

            <SectionWrapper
              id="demo-flow"
              eyebrow="Presentation Flow"
              title="Demo Flow"
              description="A clear storyline for judges and investors: upload the dataset, let the pipeline reason over it, and export clean submission output."
            >
              <div className="glass-panel rounded-[34px] p-5 sm:p-6 lg:p-7">
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  {demoFlow.map((item, index) => (
                    <div key={item.label} className="relative">
                      <div className="glass-panel surface-hover rounded-[28px] p-5 h-full">
                        <div className="flex items-center justify-between gap-3">
                          <div className="rounded-2xl bg-white/10 p-3">
                            <item.icon className="h-5 w-5 text-cyan-300" />
                          </div>
                          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">0{index + 1}</span>
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-white">{item.label}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-400">{item.detail}</p>
                      </div>
                      {index < demoFlow.length - 1 ? (
                        <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-gradient-to-r from-cyan-300/60 to-transparent xl:block" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper
              id="export"
              eyebrow="Submission Output"
              title="JSON Export"
              description="Generate the official submission payload from the findings currently shown in the dashboard, validate required fields, and copy or download the export with confidence."
              actions={
                <>
                  <Badge tone={exportWarnings.length === 0 ? "emerald" : "amber"}>
                    {exportWarnings.length === 0 ? "Schema ready" : `${exportWarnings.length} warnings`}
                  </Badge>
                  <button
                    onClick={handleDownloadJson}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Download JSON
                  </button>
                </>
              }
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <div className="glass-panel rounded-[32px] p-5 sm:p-6">
                  <p className="text-sm text-slate-400">Submission controls</p>
                  <div className="mt-5">
                    <label className="text-sm text-slate-300">team_id</label>
                    <input
                      value={teamId}
                      onChange={(event) => setTeamId(event.target.value)}
                      placeholder="your_team_name"
                      className="control-input mt-2 w-full"
                    />
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      "team_id is editable and included",
                      "categories use official exact strings",
                      "pages are emitted as arrays",
                      "document_refs are emitted as arrays",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={handleCopyJson}
                      className="control-button control-button-primary interactive-pill"
                    >
                      {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy JSON"}
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="control-button control-button-secondary"
                    >
                      Download JSON
                    </button>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-slate-400">Validation warnings</p>
                    <div className="mt-3 space-y-3">
                      {exportWarnings.length > 0 ? (
                        exportWarnings.map((warning) => (
                          <div
                            key={warning}
                            className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100"
                          >
                            {warning}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100">
                          All required export fields are present for the currently displayed findings.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-[32px] p-0">
                  <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-400">Official submission preview</p>
                      <p className="text-base font-semibold text-white">submission.json</p>
                    </div>
                    <FileJson2 className="h-5 w-5 text-cyan-300" />
                  </div>
                  <pre className="scroll-panel max-h-[560px] overflow-auto p-6 text-xs leading-6 text-slate-300">
                    <code className="block min-w-0 wrap-anywhere">{JSON.stringify(exportPayload, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </SectionWrapper>
          </div>

          <footer className="mt-10 pb-8">
            <div className="glass-panel rounded-[34px] p-5 sm:p-6 lg:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">FinNeedle AI</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Audit-grade document intelligence for financial fraud needle detection.</h3>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                    Built for hackathon presentation clarity: trusted reference validation, parsed financial document
                    exploration, multi-stage detection, scoring transparency, and exact submission export in one premium workflow.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm text-slate-400">Team</p>
                    <p className="mt-3 wrap-anywhere text-lg font-semibold text-white">{teamId || "your_team_name"}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Presentation-ready prototype designed for judges, operators, and audit stakeholders.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm text-slate-400">Product Summary</p>
                    <p className="mt-3 text-lg font-semibold text-white">Upload. Investigate. Export.</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      A modern fintech AI surface that makes complex audit logic understandable in minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
        </div>
      </div>

      {selectedDocument ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm">
          <div className="glass-panel flex h-[calc(100vh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border-white/10 bg-slate-950/95 shadow-2xl sm:h-[calc(100vh-2rem)]">
            <div className="scroll-panel min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Extracted document view</p>
                  <h3 className="mt-2 wrap-anywhere text-2xl font-semibold text-white">{selectedDocument.docId}</h3>
                  <p className="mt-2 text-sm text-slate-400 wrap-anywhere">
                    Structured extraction panel for {selectedDocument.type.toLowerCase()} review and cross-reference validation.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="control-button control-button-secondary min-h-10 shrink-0 px-3 py-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Document type", value: selectedDocument.type },
                  { label: "Reference ID", value: selectedDocument.docId },
                  { label: "Pages", value: selectedDocument.pages },
                  { label: "Linked vendor", value: selectedDocument.vendor },
                  { label: "Linked PO", value: selectedDocument.linkedPo },
                  { label: "Date", value: selectedDocument.date },
                ].map((item) => (
                  <div key={item.label} className="glass-panel rounded-3xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-2 wrap-anywhere text-base font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 glass-panel rounded-[30px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-white">Validation posture</p>
                  <Badge tone={riskBadgeTone[selectedDocument.riskLevel]}>{selectedDocument.riskLevel} risk</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedDocument.extractedFields.validationFlags.map((flag) => (
                    <Badge key={flag} tone={flag.includes("verified") || flag.includes("valid") ? "emerald" : flag.includes("quote") ? "blue" : "amber"}>
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-6">
                <div className="glass-panel rounded-[30px] p-5">
                  <p className="text-lg font-semibold text-white">Totals</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {Object.entries(selectedDocument.extractedFields.totals).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{key}</p>
                        <p className="mt-2 wrap-anywhere text-lg font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[30px] p-5">
                  <p className="text-lg font-semibold text-white">Line items</p>
                  <div className="mt-4 space-y-3">
                    {selectedDocument.extractedFields.lineItems.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 wrap-anywhere">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[30px] p-5">
                  <p className="text-lg font-semibold text-white">Linked references</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedDocument.extractedFields.linkedReferences.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200 wrap-anywhere">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-panel rounded-[30px] p-5">
                  <p className="text-lg font-semibold text-white">Additional extracted fields</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(selectedDocument.extractedFields)
                      .filter(([key]) => !["totals", "lineItems", "linkedReferences", "validationFlags"].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{key}</p>
                          <p className="mt-2 wrap-anywhere text-base text-white">{value}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedFinding ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm">
          <div className="glass-panel flex h-[calc(100vh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border-white/10 bg-slate-950/95 shadow-2xl sm:h-[calc(100vh-2rem)]">
            <div className="scroll-panel min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Finding rationale</p>
                  <h3 className="mt-2 wrap-anywhere text-2xl font-semibold text-white">{selectedFinding.finding_id}</h3>
                  <p className="mt-2 text-sm text-slate-400 wrap-anywhere">
                    Detection explanation for the official `{selectedFinding.category}` needle category.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="control-button control-button-secondary min-h-10 shrink-0 px-3 py-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Badge tone={selectedFinding.difficulty === "Easy" ? "emerald" : selectedFinding.difficulty === "Medium" ? "amber" : "rose"}>
                  {selectedFinding.difficulty}
                </Badge>
                <Badge tone={riskBadgeTone[selectedFinding.severity]}>{selectedFinding.severity}</Badge>
                <Badge tone="blue">{Math.round(selectedFinding.confidence * 100)}% confidence</Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Category", value: selectedFinding.category },
                  { label: "Pages", value: selectedFinding.pages },
                  { label: "Document refs", value: selectedFinding.document_refs },
                  { label: "Reported value", value: selectedFinding.reported_value },
                  { label: "Correct value", value: selectedFinding.correct_value },
                  { label: "Confidence", value: `${Math.round(selectedFinding.confidence * 100)}%` },
                ].map((item) => (
                  <div key={item.label} className="glass-panel rounded-3xl p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-2 wrap-anywhere text-base font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 glass-panel rounded-[30px] p-5">
                <p className="text-lg font-semibold text-white">Why it was detected</p>
                <p className="mt-4 text-sm leading-7 text-slate-300 wrap-anywhere">{selectedFinding.why_detected}</p>
              </div>

	              <div className="mt-6 glass-panel rounded-[30px] p-5">
	                <p className="text-lg font-semibold text-white">Validation notes</p>
	                <div className="mt-4 space-y-3">
	                  {selectedFinding.validation_notes.map((note) => (
	                    <div key={note} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 wrap-anywhere">
	                      {note}
	                    </div>
	                  ))}
	                </div>
	              </div>
	            </div>
	          </div>
	        </div>
	      ) : null}
	    </div>
	  );
	}
