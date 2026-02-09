export const extraCostsTranslations = {
  en: {
    page_title: "Extra Costs",
    page_description:
      "View and manage one-time costs and reimbursements for this project.",
    loading: "Loading extra costs...",
    no_extra_costs: "No extra costs found",
    no_extra_costs_desc: "There are no extra costs for this project yet.",
    no_filtered_results: "No costs match your filters",
    no_filtered_results_desc: "Try adjusting your filters to see more results.",
    clear_filters: "Clear Filters",
    load_more: "Load More",
    loading_more: "Loading...",
    
    // Status labels
    status: "Status",
    status_invoiced: "Invoiced",
    status_uninvoiced: "Uninvoiced",
    status_voided: "Voided",
    status_separate: "Separate",
    status_grouped: "Grouped",
    
    // Table headers
    name: "Name",
    description: "Description",
    quantity: "Quantity",
    price_per_unit: "Price per unit",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    created_date: "Created",
    invoice: "Invoice",
    
    // Details
    expand_details: "Expand Details",
    collapse_details: "Collapse Details",
    view_invoice: "View Invoice",
    invoice_link: "Invoice",
    
    // Calculations
    quantity_label: "Quantity",
    price_per_unit_label: "Price per unit",
    subtotal_label: "Subtotal",
    tax_label: "Tax",
    tax_amount: "Tax amount",
    total_with_tax: "Total with tax",
    
    // Filters
    search_placeholder: "Search by name or description...",
    filter_by_status: "Filter by status",
    filter_by_invoice: "Filter by invoice",
    filter_by_tax: "Filter by tax rate",
    filter_by_type: "Filter by type",
    filter_all: "All",
    filter_invoiced: "Invoiced",
    filter_uninvoiced: "Uninvoiced",
    filter_voided: "Voided",
    filter_separate: "Separate",
    filter_grouped: "Grouped",
    filter_by_date: "Filter by date",
    date_range_placeholder: "Select date range",
    active_filters: "Active Filters",
    
    // Invoice context
    viewing_invoice_costs: "Viewing costs for this invoice",
    invoice_number: "Invoice",
    invoice_date: "Date",
    
    // Reimbursement
    reimbursement: "Reimbursement",
    
    // Date formatting
    date_format: "MM/DD/YYYY",
  },
  nl: {
    page_title: "Extra Kosten",
    page_description:
      "Bekijk en beheer eenmalige kosten en terugbetalingen voor dit project.",
    loading: "Extra kosten laden...",
    no_extra_costs: "Geen extra kosten gevonden",
    no_extra_costs_desc: "Er zijn nog geen extra kosten voor dit project.",
    no_filtered_results: "Geen kosten komen overeen met uw filters",
    no_filtered_results_desc: "Probeer uw filters aan te passen om meer resultaten te zien.",
    clear_filters: "Filters Wissen",
    load_more: "Meer Laden",
    loading_more: "Laden...",
    
    // Status labels
    status: "Status",
    status_invoiced: "Gefactureerd",
    status_uninvoiced: "Niet gefactureerd",
    status_voided: "Geannuleerd",
    status_separate: "Apart",
    status_grouped: "Gegroepeerd",
    
    // Table headers
    name: "Naam",
    description: "Omschrijving",
    quantity: "Aantal",
    price_per_unit: "Prijs per eenheid",
    subtotal: "Subtotaal",
    tax: "BTW",
    total: "Totaal",
    created_date: "Aangemaakt",
    invoice: "Factuur",
    
    // Details
    expand_details: "Details Uitklappen",
    collapse_details: "Details Inklappen",
    view_invoice: "Bekijk Factuur",
    invoice_link: "Factuur",
    
    // Calculations
    quantity_label: "Aantal",
    price_per_unit_label: "Prijs per eenheid",
    subtotal_label: "Subtotaal",
    tax_label: "BTW",
    tax_amount: "BTW bedrag",
    total_with_tax: "Totaal inclusief BTW",
    
    // Filters
    search_placeholder: "Zoeken op naam of omschrijving...",
    filter_by_status: "Filter op status",
    filter_by_invoice: "Filter op factuur",
    filter_by_tax: "Filter op BTW-tarief",
    filter_by_type: "Filter op type",
    filter_all: "Alles",
    filter_invoiced: "Gefactureerd",
    filter_uninvoiced: "Niet gefactureerd",
    filter_voided: "Geannuleerd",
    filter_separate: "Apart",
    filter_grouped: "Gegroepeerd",
    filter_by_date: "Filter op datum",
    date_range_placeholder: "Selecteer datumbereik",
    active_filters: "Actieve Filters",
    
    // Invoice context
    viewing_invoice_costs: "Bekijken van kosten voor deze factuur",
    invoice_number: "Factuur",
    invoice_date: "Datum",
    
    // Reimbursement
    reimbursement: "Terugbetaling",
    
    // Date formatting
    date_format: "DD/MM/YYYY",
  },
};

export type ExtraCostsLanguage =
  keyof typeof extraCostsTranslations;

