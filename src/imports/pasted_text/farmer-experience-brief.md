Design a complete high-fidelity responsive web/mobile farmer experience for a product called “KisanSetu”, an Indian direct farm-to-buyer agricultural marketplace and smart selling platform created for Smart India Hackathon 2026.

IMPORTANT PRODUCT PRINCIPLE:

The core UX philosophy is:
“Show the right information at the right place, at the right time.”

The interface must NOT feel crowded.
Do not put every feature on the dashboard.
Keep information progressively disclosed.
Only show essential information initially, and reveal detailed information when the farmer asks for it.

The target user is an Indian farmer who may not be highly technically experienced.

The design must therefore be extremely clear, simple, trustworthy, readable, touch-friendly and visually calm.

==================================================
BRAND / VISUAL DESIGN SYSTEM
==================================================

Brand personality:
Trustworthy + agricultural + modern + premium + practical + AI-assisted.

Color palette:

Primary Forest Emerald: #063B2A
Secondary Deep Green: #0B4F3A
Harvest Gold CTA: #F4C44E
Light Green Surface: #EAF5EE
Warm Off-White Background: #F7F6F1
White: #FFFFFF
Primary Text: #17221D
Secondary Text: #66736C
Success Green: #238B5B
Warning Amber: #D99A25
Error Red: #C94B4B

Use Forest Emerald for navigation, primary actions and important headings.

Use Harvest Gold sparingly for primary high-value CTAs and important highlights.

Use light green backgrounds for AI recommendations and successful states.

Avoid excessive gradients.
Avoid excessive glassmorphism.
Avoid neon colors.
Avoid overly futuristic AI visuals.
Avoid excessive shadows.
Avoid excessive decorative illustrations.

Typography:
Use Inter or a highly similar clean sans-serif font.

Use strong typography hierarchy:
Page headings: 28–36px
Section headings: 20–24px
Body: 15–16px
Supporting text: 13–14px
Metadata: 12px

Cards:
18–24px corner radius.
Subtle borders.
Very subtle shadows.
Large whitespace.
Clear grouping.

Use Auto Layout and responsive constraints throughout.

Create reusable components for:
buttons
cards
crop cards
status badges
AI recommendation cards
bottom navigation
modal headers
progress timeline
form fields
buyer cards
transport cards
storage cards
summary cards
quality report cards

==================================================
REAL IMAGE POLICY
==================================================

Use realistic crop imagery only where it improves recognition.

Use small realistic images/icons for crops such as:
Tomato
Onion
Grapes
Potato
Wheat
Maize
Soybean
Cotton

Do NOT use huge decorative agricultural photographs inside the farmer dashboard.

The dashboard must remain functional and information-focused.

==================================================
SCREEN 1 — FARMER DASHBOARD
==================================================

Create a clean farmer dashboard after successful farmer login.

Desktop and mobile responsive variants.

Top header:
KisanSetu logo
Farmer profile/name
Notification icon
Profile/avatar

Main content:

Heading:
“My Crops”

Supporting text:
“Track your crops, growth and selling readiness.”

Do NOT place large charts, news feeds, weather cards, market tickers or excessive statistics on this screen.

The main page should primarily contain crop cards.

Create two large crop cards as examples:

CARD 1:
Tomato
Hybrid Table S-31
2 Acres

Sowing Date:
20 Jun 2026

Expected Harvest:
10 Sep 2026

Expected Yield:
60 Quintals

Money Spent:
₹28,000

Growth Stage:
Fruiting / Ripening

Health:
Healthy

Maturity Progress:
75%

Bottom action:
“View Crop”

CARD 2:
Onion
Nashik Red Garwa
3 Acres

Sowing Date:
15 Jul 2026

Expected Harvest:
20 Nov 2026

Expected Yield:
85 Quintals

Money Spent:
₹32,000

Growth Stage:
Bulb Development

Health:
Healthy

Maturity Progress:
52%

Bottom action:
“View Crop”

Crop cards should visually prioritize:
crop identity
growth stage
harvest timing
yield
health
progress

Do not overload the card.

Bottom navigation must remain fixed:

Home
My Crops
+ Add Crop
Market
Schemes

The center Add Crop button may use a circular elevated button.

Navigation should be simple and mobile-friendly.

==================================================
SCREEN 2 — CROP DETAILS FLOATING SECTION
==================================================

When the farmer clicks a crop card, DO NOT navigate to a completely separate page.

Open a large floating modal / responsive dialog over the dashboard.

Desktop:
large centered modal approximately 80–90% viewport width.

Mobile:
full-height bottom-sheet / modal.

Background dashboard should remain slightly dimmed.

Top:
Back / Close button
Crop name
Variety
Crop status

Title:
“Tomato — Hybrid Table S-31”

Section:
“Crop Overview”

Show only relevant information:

Plot Size
2 Acres

Sowing Date
20 Jun 2026

Expected Harvest
10 Sep 2026

Expected Yield
60 Quintals

Cultivation Expense
₹28,000

Growth Stage
Fruiting / Ripening

Health Status
Healthy

Maturity Progress
75%

Do NOT create a separate “Growth Expenses” section because cultivation expenses are already shown in the overview.

Do NOT create a Notes section.

Do NOT duplicate information.

Add a clear secondary button:

“Complete AI Quality Check”

If already completed:
“View AI Quality Report”

At the bottom place a large primary action:

“Sell This Crop”

This button starts the Smart Sell workflow.

==================================================
SCREEN 3 — SMART SELL FLOATING WORKSPACE
==================================================

When “Sell This Crop” is clicked:

Open another large floating modal/workspace.

The modal must NOT immediately show all information.

Use progressive step-by-step disclosure.

Top modal header:

“Smart Sell”
“Tomato • 60 Quintals”

Include:
Back
Exit / Close

Create a horizontal 6-step progress timeline:

1. AI Suggestion
2. Buyer
3. Transport
4. Storage
5. Quality Check
6. Confirm & Sell

Only ONE step's detailed content is visible at a time.

Previous and Next buttons appear at the bottom.

The farmer must complete/confirm the current step before proceeding.

==================================================
STEP 1 — AI SUGGESTION
==================================================

Title:
“AI Smart Selling Recommendation”

Show a clean recommendation summary.

AI recommends:

Buyer:
Deccan Fresh Exports

Offer:
₹2,580 / Qtl

Transport:
Tata Ace / Mini Truck

Estimated Transport:
₹728

Storage:
WDRA Godown

Estimated Net Realization:
₹1,26,072

Use a highlighted light-green AI recommendation card.

Heading:
“Recommended for You”

Show 2–3 concise reasons:
Best nearby price
Lower logistics cost
Suitable for Grade A produce

Do NOT show a giant AI explanation.

Add:
“View Detailed AI Reasoning”

Optional expandable area.

Add prominent button:

“Download AI Advisory Report”

Support PDF and printable report concept.

At bottom:
“Continue to Buyer →”

==================================================
STEP 2 — BUYER SELECTION
==================================================

Title:
“Choose Buyer”

At the top show:

⭐ AI Recommended

Deccan Fresh Exports
₹2,580 / Qtl
28 km
Grade A requirement

Highlight this card with Forest Emerald border and subtle AI badge.

Below it:

“Other Suitable Buyers”

Show several buyer cards with:
Buyer name
distance
offer price
quality requirement
transport support

Do NOT show dozens of buyers simultaneously.

Provide:
“View More Buyers”

Each buyer has:
Select button

Add:
“Negotiate” action.

Clicking Negotiate opens a smaller counter-offer modal with:
Current buyer bid
Your counter-offer
Quantity
Delivery terms
Submit Counter Offer

After selection:
“✓ Buyer Selected”

Continue:
“Next: Transport →”

==================================================
STEP 3 — TRANSPORT
==================================================

Title:
“Choose Transport”

Top highlighted card:

⭐ AI Recommended

Tata Ace / Mini Truck

Distance:
28 km

Estimated Cost:
₹728

Below show alternatives:

Bolero Pickup
Tractor Trolley
Reefer Van
FPO Shared Van

Each card should display:
estimated cost
capacity
distance
suitability

The AI recommended option is highlighted but NOT automatically confirmed.

Farmer must select/confirm.

Continue:
“Next: Storage →”

==================================================
STEP 4 — STORAGE
==================================================

Title:
“Choose Storage”

Top AI recommendation:

⭐ AI Recommended

WDRA Godown

Distance:
14 km

Storage cost:
show realistic demo value

Show alternatives:

Cold Storage
Government Warehouse
Other nearby storage

Also allow:

“No Storage — Sell Directly”

If AI determines direct selling is better, show:

“AI Recommendation:
Sell directly — storage may reduce your expected profit.”

This is an important Smart Selling feature.

Continue:
“Next: Quality Check →”

==================================================
STEP 5 — AI QUALITY CHECK
==================================================

Title:
“AI Quality Check”

If the farmer has already completed the quality check from Crop Details, display the existing result instead of asking them to repeat it.

Show:

✓ AI Quality Check Completed

Grade A
Premium Export Quality

Moisture:
11.4%

Size:
58 mm

Defects:
1.2%

AI Confidence:
97.8%

Show:
“View Quality Report”

If the farmer has NOT completed it:

Show:
“Quality check not completed”

Button:
“Complete AI Quality Check”

The quality check may include:
photo upload
camera capture
moisture input
size/caliber
foreign matter
pest damage

Show an AI-generated grade:
Grade A / B / C

Do not duplicate the entire assay workflow if the report already exists.

Continue:
“Next: Final Review →”

==================================================
SCREEN 4 — FINAL CONFIRMATION
==================================================

Title:
“Final Trade Summary”

This is the ONLY step where all selected information is brought together.

Show:

CROP
Tomato — Hybrid Table S-31
60 Quintals

BUYER
Deccan Fresh Exports
₹2,580 / Qtl

TRANSPORT
Tata Ace / Mini Truck
₹728

STORAGE
WDRA Godown
Selected

QUALITY
Grade A ✓

GROSS REALIZATION
₹1,54,800

ESTIMATED NET REALIZATION
₹1,26,072

Use a very clean summary card.

Below:

Escrow / protection notice:

“Your trade will enter the protected selling process after confirmation.”

Do not use overly technical financial language.

Primary CTA:

“Confirm & Start Selling →”

Secondary:
“← Back”

Also provide:
“Exit”

==================================================
AFTER CONFIRMATION
==================================================

After the farmer clicks:

“Confirm & Start Selling”

The Smart Sell floating workspace closes.

Return to Farmer Dashboard.

The crop changes from:

“Ready to Sell”

to:

“Active Sale”

Create a compact Active Selling card.

Example:

ACTIVE SELLING
Tomato • 60 Quintals
Deccan Fresh Exports

Progress timeline:

✓ Escrow Locked
● Transport Pickup
○ Quality Assayed
○ Payment Released

Show:
Agreed Trade Value
Logistics status
Current stage

Do NOT display all transaction details on the dashboard.

Provide:
“View Sale Details”

==================================================
INTERACTION RULES
==================================================

1. Never overwhelm the farmer with all information at once.

2. Use progressive disclosure.

3. One Smart Sell step at a time.

4. Always show the AI recommendation first.

5. AI recommendations are highlighted but the farmer remains in control.

6. Never force the AI recommendation.

7. Back button allows returning to previous step.

8. Exit/Close allows closing the floating workspace.

9. Closing Smart Sell before confirmation should preserve the current state.

10. Final confirmation closes Smart Sell and returns to the dashboard.

11. Avoid duplicate information.

12. Avoid unnecessary sections.

13. Avoid giant charts on the main dashboard.

14. Keep the primary task visually dominant.

15. Use clear Indian currency formatting such as ₹2,580/Qtl.

16. Use realistic agricultural terminology.

17. Keep text short and scannable.

18. Design for farmers using mobile phones first, while providing responsive desktop/tablet layouts.

==================================================
RESPONSIVE DESIGN
==================================================

Desktop:
Centered content max-width approximately 1200–1280px.

Tablet:
Two-column cards where appropriate.

Mobile:
Single-column layout.

Bottom navigation remains fixed.

Crop cards become full-width.

Smart Sell modal becomes nearly full-screen.

6-step timeline becomes horizontally scrollable or compact step indicator.

Buttons should have large touch targets.

Do not shrink text excessively.

Use Auto Layout, constraints and reusable components.

==================================================
FIGMA STRUCTURE
==================================================

Create these frames:

01 — Design System
02 — Farmer Dashboard Desktop
03 — Farmer Dashboard Mobile
04 — Crop Details Modal Desktop
05 — Crop Details Modal Mobile
06 — Smart Sell Step 1 AI Suggestion
07 — Smart Sell Step 2 Buyer
08 — Smart Sell Step 3 Transport
09 — Smart Sell Step 4 Storage
10 — Smart Sell Step 5 Quality Check
11 — Smart Sell Step 6 Final Review
12 — Active Selling State
13 — Buyer Negotiation Modal
14 — AI Quality Report State

Use meaningful component and layer names.

Create reusable components and variants.

Use variables for:
colors
spacing
typography
border radius
component states

Use Auto Layout everywhere appropriate.

Maintain consistent spacing and alignment.

==================================================
FINAL QUALITY BAR
==================================================

The final interface should look like a polished SIH 2026 prototype suitable for judging.

It should communicate:

Trust
Simplicity
Farmer-first UX
Direct farm-to-buyer selling
AI-assisted decision making
Transparent pricing
Quality assurance
Logistics optimization
Protected selling / escrow workflow

It should NOT look like:
a generic AI dashboard
a crypto trading platform
a banking admin panel
a cluttered enterprise dashboard
a futuristic sci-fi interface

The final result must feel like:
“A trusted digital marketplace built specifically for Indian farmers.”

Prioritize clarity over decoration.
Prioritize usability over showing every feature.
Prioritize progressive disclosure over information density.