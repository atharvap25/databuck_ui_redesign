---
name: saas-frontend-polish
description: Elevate the aesthetic execution and polish of frontend SaaS components while strictly adhering to the existing design system. Use this skill to refine layouts, improve spacing, enhance typography hierarchy, and add subtle micro-interactions without inventing new colors, fonts, or overarching themes.
---

This skill guides the creation of production-grade, highly polished frontend interfaces for SaaS applications. The goal is to take existing structural requirements and design tokens (colors, typography, spacing variables) and execute them with exceptional attention to aesthetic detail, elevating the UI from "basic" to "premium."

You must strictly reference the project's `Design.md` and established design system for all foundational styling choices. Do not invent new brand colors, change font families, or drastically alter established layouts. 

## Design Thinking: SaaS Polish

Before writing code, analyze the requirement through the lens of enterprise-grade UI execution:
- **Clarity for Executives:** The interface is built for business users and executives. The primary goal is data clarity, trust, and frictionless workflow. Avoid visual noise.
- **Micro-Aesthetics:** How can we use subtle variations in font weight, opacity, and borders to create visual hierarchy without introducing new colors?
- **Spatial Harmony:** Are the margins, padding, and gaps mathematically consistent? Does the whitespace guide the user's eye naturally through the complex data or forms?
- **Elevation and Depth:** How can subtle shadow work, borders, or background tinting separate active surfaces (like modals, dropdowns, and cards) from the base layout?

## Execution Guidelines

Strictly apply the following aesthetic enhancements using ONLY the project's authorized design variables:

- **Typography Execution (Hierarchy over Novelty):** 
  - Strictly use the fonts defined in the design system.
  - Enhance aesthetics by utilizing precise typographic hierarchy: combine varying font weights, uppercase tracking for micro-labels, and specific line-heights for readability. 
  - Use subtle text-color contrast (e.g., primary text for data, secondary text for metadata/labels) to reduce cognitive load.

- **Color Application & Elevation:** 
  - Never introduce unauthorized colors.
  - Create depth using the established palette: utilize authorized border colors to define structural boundaries, subtle background tints for hover states, and precise box-shadows to elevate interactive elements.
  - Ensure contrast ratios meet accessibility standards for business applications.

- **Spatial Composition & Alignment:**
  - Execute flawless alignment. Ensure grid gaps and flex layouts are perfectly spaced.
  - Use generous, consistent negative space to group related information (Gestalt principles). Prevent dense data from looking cluttered by utilizing controlled padding within table cells, cards, and form inputs.

- **Motion & Micro-Interactions:**
  - Add highly polished, understated CSS transitions for state changes (hover, focus, active, disabled).
  - Use quick, snappy easing curves (e.g., `ease-out`, 150ms-200ms) for dropdowns, tooltips, and modal reveals so the application feels fast and responsive. 
  - Avoid heavy, distracting, or theatrical animations; motion should strictly serve user feedback and state awareness.

- **Component & Data Polish:**
  - **Forms:** Focus on input focus states, subtle background fills, alignment of validation messages, and clear labeling.
  - **Data Visualization/Tables:** Ensure clear row delineation (subtle borders or alternating background tints), sticky headers, and perfectly aligned numerical data (tabular nums).
  - **Empty States & Loading:** Ensure skeletons or empty states are styled cohesively with the rest of the layout, providing a premium feel even when data is absent.

**CRITICAL RULE:** Your role is to beautifully orchestrate the existing design system, not to replace it. Elegance in SaaS comes from flawless alignment, restrained use of color, perfect typography scaling, and crisp micro-interactions.