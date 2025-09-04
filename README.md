# XYZ Custody Account Opening Form - Angular Application

A dynamic Angular form application that replicates the XYZ Custody Account Opening Form Excel worksheet with comprehensive conditional field logic and validation.

## Overview

This project converts a complex Excel-based financial form into a modern web application, preserving all conditional logic, validation rules, and user experience from the original Excel format.

## Features

### 📋 Form Structure
- **4 Main Tabs**: AOF Page 1, AOF Page 2, Additional SWIFTs, User Guide
- **15 Numbered Sections**: From General Account Information to Fund Order & Custody
- **Dynamic Field Types**: Text inputs, dropdowns, checkboxes, radio buttons, multiselect, tables

### 🔄 Conditional Logic
- **Service-Based Conditionals**: Fields show/hide based on selected services (FX, Cash, Physical)
- **Address Logic**: Billing address fields conditional on "Same as Primary" selection
- **Mailing Format Dependencies**: SWIFT/Infuse options based on format selection
- **Cross-Page Validation**: Dependencies between different form sections

### ✅ Validation & UX
- **Field-Level Validation**: Pattern matching, required fields, character limits
- **Cross-Field Rules**: Complex business logic validation
- **Real-time Feedback**: Dynamic error messages and help text
- **Excel-Like Experience**: Maintains familiar workflow and visual design

## Technical Implementation

### Metadata-Driven Architecture
- **form-metadata.json**: Complete form structure with conditional logic
- **Dynamic Field Rendering**: Components generated from metadata
- **Conditional Engine**: Reactive form logic based on field dependencies

### Key Conditional Patterns
```json
{
  "conditional": {
    "field": "triggerFieldName",
    "operator": "equals|in|not_equals", 
    "value": "expectedValue|[array]",
    "showWhen": true|false
  }
}
```

## Project Structure

```
├── form-metadata.json          # Complete form configuration
├── req/                        # Requirements and source files
│   └── XYZ Custody Account Opening Form - Client.xlsx
├── src/                        # Angular application source
├── README.md                   # This file
└── .gitignore                 # Git exclusions
```

## Form Sections

### AOF Page 1
1. **General Account Information** - Basic account setup and XYZ number reservation
2. **Account Services** - Foreign Exchange, Cash Services, Physical services
3. **Global Custody Markets and Cash** - Currency and market preferences  
4. **Intended Tax Treatment** - Tax classification and FATCA status
5. **Foreign Exchange Confirmation** - Methodology selection (conditional)

### AOF Page 2  
6. **Cash Posting Transactions** - Transaction processing settings
7. **Mailing Products** - SWIFT/Infuse format selection and options
8. **Wire Transfer Address** - Banking details and SWIFT codes
9. **Billing Address** - Address information with conditional fields
10. **Cash Accounting** - Accounting configuration
11. **Trades - Custody** - Trade processing settings
12. **Payments - Cash** - Payment processing configuration
13. **FWDP Forward Processing** - MT304 forward processing settings
14. **Corporate Actions** - Corporate action handling
15. **Fund Order & Custody** - Fund management settings

## Conditional Logic Examples

- **XYZ Account Number**: Only shows when "Do you have XYZ Account Number reserved?" = "Yes"
- **FX Confirmation**: Required when Foreign Exchange services selected
- **Billing Address**: Street/City/Country fields hidden when "Same as Primary" checked
- **Mailing Options**: SWIFT options show for SWIFT/Both, Infuse ID for Infuse/Both

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start development server: `ng serve`
4. Navigate to `http://localhost:4200`

## Contributing

This project maintains exact parity with the Excel form functionality. Any changes should preserve the conditional logic and validation rules defined in the metadata.

## License

Proprietary - XYZ Custody Account Opening Form Application