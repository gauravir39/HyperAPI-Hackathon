import {
  getVendorByName,
  hasDuplicateLineItems,
  isInvalidCalendarDate,
  isSoftVendorNameMismatch,
  parseCurrency,
  parsePages,
} from "./validationHelpers";

const categoryDifficulty = {
  arithmetic_error: "Easy",
  invalid_date: "Easy",
  duplicate_line_item: "Easy",
  po_invoice_mismatch: "Medium",
  vendor_name_typo: "Medium",
  ifsc_mismatch: "Medium",
  fake_vendor: "Evil",
  phantom_po_reference: "Evil",
  quantity_accumulation: "Evil",
  balance_drift: "Evil",
};

const categorySeverity = {
  arithmetic_error: "Low",
  invalid_date: "Medium",
  duplicate_line_item: "Medium",
  po_invoice_mismatch: "High",
  vendor_name_typo: "Medium",
  ifsc_mismatch: "High",
  fake_vendor: "Critical",
  phantom_po_reference: "Critical",
  quantity_accumulation: "High",
  balance_drift: "Critical",
};

function createFinding({
  findingId,
  category,
  pages,
  documentRefs,
  reportedValue,
  correctValue,
  confidence,
  whyDetected,
  validationNotes,
}) {
  return {
    finding_id: findingId,
    category,
    difficulty: categoryDifficulty[category],
    pages,
    document_refs: documentRefs.join(", "),
    reported_value: reportedValue,
    correct_value: correctValue,
    confidence,
    severity: categorySeverity[category],
    why_detected: whyDetected,
    validation_notes: validationNotes,
  };
}

export function parseMockDocuments(documents, vendors) {
  return documents.map((document) => {
    const vendorRecord = getVendorByName(vendors, document.vendor);
    const totals = Object.fromEntries(
      Object.entries(document.extractedFields.totals).map(([key, value]) => [key, parseCurrency(value)])
    );

    const hintMap = {
      "INV-2048": {
        ocrVendorName: "Apex Componnents Ltd",
        lineAmounts: [12900, 12900, 13800],
      },
      "PO-8821": {
        approvedTotal: 17900,
      },
      "BS-1190": {
        expectedClosingBalance: 128180,
        statementIfsc: "YESB0007780",
        settlementDate: "2026-02-30",
      },
      "ER-4419": {
        duplicateExpenseId: "EXP-4419-A",
      },
      "DN-5520": {
        duplicateLineItems: true,
      },
      "CN-1772": {
        quantityRollup: 184,
        approvedQuantity: 132,
      },
    };

    const hints = hintMap[document.docId] ?? {};

    return {
      ...document,
      pagesArray: parsePages(document.pages),
      vendorRecord,
      totals,
      hints,
      extractedFields: {
        ...document.extractedFields,
        lineItems:
          document.docId === "DN-5520"
            ? [...document.extractedFields.lineItems, "Expedite fee"]
            : document.extractedFields.lineItems,
      },
    };
  });
}

export function runMockParsing(documents, vendors) {
  return parseMockDocuments(documents, vendors);
}

export function runMockRuleEngine(parsedDocuments, vendors) {
  const findings = [];
  const byId = Object.fromEntries(parsedDocuments.map((document) => [document.docId, document]));
  const invoices = parsedDocuments.filter((document) => document.type === "Invoice");
  const purchaseOrders = parsedDocuments.filter((document) => document.type === "Purchase Order");
  const bankStatements = parsedDocuments.filter((document) => document.type === "Bank Statement");

  const invoice2048 = byId["INV-2048"];
  if (invoice2048) {
    const recomputedTotal = invoice2048.hints.lineAmounts.reduce((sum, value) => sum + value, 0) + invoice2048.totals.tax;
    if (Math.abs(recomputedTotal - invoice2048.totals.grandTotal) > 1) {
      findings.push(
        createFinding({
          findingId: "F-001",
          category: "arithmetic_error",
          pages: "8",
          documentRefs: ["INV-2048"],
          reportedValue: invoice2048.extractedFields.totals.grandTotal,
          correctValue: recomputedTotal.toFixed(2),
          confidence: 0.97,
          whyDetected: "Recomputed invoice arithmetic from extracted line amounts and tax does not match the stated grand total.",
          validationNotes: ["line totals summed from OCR extraction", "tax preserved from source document"],
        })
      );
    }
  }

  const bankStatement = byId["BS-1190"];
  if (bankStatement && isInvalidCalendarDate(bankStatement.hints.settlementDate)) {
    findings.push(
      createFinding({
        findingId: "F-002",
        category: "invalid_date",
        pages: "25",
        documentRefs: ["BS-1190"],
        reportedValue: bankStatement.hints.settlementDate,
        correctValue: "2026-02-28",
        confidence: 0.89,
        whyDetected: "The parsed settlement date does not map to a valid calendar day for the reported month.",
        validationNotes: ["date parse failed strict calendar validation", "bank statement month-end referenced February"],
      })
    );
  }

  const debitNote = byId["DN-5520"];
  if (debitNote && hasDuplicateLineItems(debitNote.extractedFields.lineItems)) {
    findings.push(
      createFinding({
        findingId: "F-003",
        category: "duplicate_line_item",
        pages: "41",
        documentRefs: ["DN-5520"],
        reportedValue: "Expedite fee x2",
        correctValue: "Expedite fee x1",
        confidence: 0.91,
        whyDetected: "The same normalized line item appears more than once in the debit note extraction with no quantity justification.",
        validationNotes: ["duplicate normalized label found", "supporting note reason absent"],
      })
    );
  }

  const po8821 = byId["PO-8821"];
  if (po8821 && invoice2048 && Math.abs(po8821.hints.approvedTotal - po8821.totals.grandTotal) > 1) {
    findings.push(
      createFinding({
        findingId: "F-004",
        category: "po_invoice_mismatch",
        pages: "13-16",
        documentRefs: ["PO-8821", "INV-2048"],
        reportedValue: po8821.extractedFields.totals.grandTotal,
        correctValue: po8821.hints.approvedTotal.toFixed(2),
        confidence: 0.95,
        whyDetected: "Matched PO and invoice references disagree on approved totals after line-level reconciliation.",
        validationNotes: ["PO linked from invoice reference graph", "variance exceeds rule threshold"],
      })
    );
  }

  if (invoice2048?.vendorRecord && isSoftVendorNameMismatch(invoice2048.hints.ocrVendorName, invoice2048.vendorRecord.vendorName)) {
    findings.push(
      createFinding({
        findingId: "F-005",
        category: "vendor_name_typo",
        pages: "4",
        documentRefs: ["INV-2048", invoice2048.vendorRecord.vendorId],
        reportedValue: invoice2048.hints.ocrVendorName,
        correctValue: invoice2048.vendorRecord.vendorName,
        confidence: 0.88,
        whyDetected: "The vendor name extracted from the invoice is a near match to Vendor Master but contains a high-risk typographic drift.",
        validationNotes: ["soft match crossed similarity threshold", "master name chosen as authoritative"],
      })
    );
  }

  if (bankStatement?.vendorRecord && bankStatement.vendorRecord.ifsc !== bankStatement.hints.statementIfsc) {
    findings.push(
      createFinding({
        findingId: "F-006",
        category: "ifsc_mismatch",
        pages: "21",
        documentRefs: ["BS-1190", bankStatement.vendorRecord.vendorId],
        reportedValue: bankStatement.hints.statementIfsc,
        correctValue: bankStatement.vendorRecord.ifsc,
        confidence: 0.95,
        whyDetected: "The bank routing code referenced in the statement does not match the IFSC registered in Vendor Master.",
        validationNotes: ["vendor master lookup failed", "bank statement wire trail mapped to suspicious branch"],
      })
    );
  }

  const suspiciousVendor = vendors.find((vendor) => vendor.validationStatus === "Suspicious");
  if (suspiciousVendor) {
    findings.push(
      createFinding({
        findingId: "F-007",
        category: "fake_vendor",
        pages: "19, 22",
        documentRefs: ["BS-1190", suspiciousVendor.vendorId, "INV-9981"],
        reportedValue: suspiciousVendor.vendorName,
        correctValue: "Unverified entity",
        confidence: 0.96,
        whyDetected: "Cross-referenced tax, routing, and onboarding signals indicate the vendor profile cannot be trusted as a legitimate counterparty.",
        validationNotes: ["vendor master status is suspicious", "payment trail still active against entity"],
      })
    );
  }

  const poIds = new Set(purchaseOrders.map((document) => document.docId));
  invoices
    .filter((document) => document.linkedPo && !poIds.has(document.linkedPo))
    .forEach((document) => {
      findings.push(
        createFinding({
          findingId: "F-008",
          category: "phantom_po_reference",
          pages: document.pagesArray[0]?.toString() ?? "4",
          documentRefs: [document.docId, document.linkedPo],
          reportedValue: document.linkedPo,
          correctValue: "Missing PO record",
          confidence: 0.94,
          whyDetected: "The invoice links to a purchase order reference that is not present in the parsed document corpus.",
          validationNotes: ["linked PO absent from parsed PO set", "reference graph cannot resolve target document"],
        })
      );
    });

  const creditNote = byId["CN-1772"];
  if (creditNote && creditNote.hints.quantityRollup > creditNote.hints.approvedQuantity) {
    findings.push(
      createFinding({
        findingId: "F-009",
        category: "quantity_accumulation",
        pages: "37-39",
        documentRefs: ["CN-1772", "INV-2216", "PO-5510"],
        reportedValue: String(creditNote.hints.quantityRollup),
        correctValue: String(creditNote.hints.approvedQuantity),
        confidence: 0.93,
        whyDetected: "Accumulated quantity adjustments exceed the quantity approved across the related invoice and PO chain.",
        validationNotes: ["rollup of linked quantity events exceeds approved baseline", "credit note chain references same inventory lot"],
      })
    );
  }

  if (bankStatement && Math.abs(bankStatement.hints.expectedClosingBalance - bankStatement.totals.closingBalance) > 1) {
    findings.push(
      createFinding({
        findingId: "F-010",
        category: "balance_drift",
        pages: "24-28",
        documentRefs: ["BS-1190", "PAY-7718", "INV-9981"],
        reportedValue: bankStatement.extractedFields.totals.closingBalance,
        correctValue: bankStatement.hints.expectedClosingBalance.toFixed(2),
        confidence: 0.98,
        whyDetected: "Opening balance, debits, and linked settlements do not reconcile to the stated closing balance without unexplained drift.",
        validationNotes: ["balance bridge reconstruction failed", "hidden transfer implied by ledger gap"],
      })
    );
  }

  return findings;
}

export function runMockAudit(documents, vendors) {
  const parsedDocuments = runMockParsing(documents, vendors);
  const findings = runMockRuleEngine(parsedDocuments, vendors);

  return {
    parsedDocuments,
    findings,
  };
}
