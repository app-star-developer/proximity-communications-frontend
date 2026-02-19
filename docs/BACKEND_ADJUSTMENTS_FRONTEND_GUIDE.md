Frontend Implementation Guide
This document outlines the backend changes made and the required frontend updates to support the new Campaign, Promo Code, and Venue management features.

Backend Changes Overview

1. Campaigns (/campaigns)
   Creation Logic:
   status field in
   createCampaign
   is now largely ignored for the initial effective status.
   If startAt is in the future, status becomes scheduled.
   If startAt is now/empty or past, status becomes active (unless explicitly draft).
   New Field: promoCode object can be passed during campaign creation to create a linked promo code immediately.
   New Endpoint/Method:
   endCampaign
   (PUT /campaigns/:id/end - Check routes implementation) - Note: Backend service logic added, ensure route exists or use
   updateCampaign
   with status='completed'.
2. Promo Codes (/promo-codes)
   New Fields:
   discountType: 'percentage' | 'fixed' (default: 'fixed')
   discountValue: number
   targetingConfiguration: JSON object for location specificity.
   status: Can now be set to active on creation.
3. Venues (/venues)
   Creation Logic:
   REMOVED: Automatic Venue Owner account creation. This is now a manual step.
   New Fields:
   ownerPhoneNumber: string (Required/Optional based on UI validation, backend treats as optional column but UI should enforce if needed).
   primaryType: Added 'pharmacy', 'supermarket', 'store' to enum.
4. Notifications
   Contextual Data:
   Notifications triggered by geofences now have access to:
   {{venueName}}
   {{venueAddress}}
   {{venueCity}}
   {{promoCode}} (Code string)
   {{promoDiscountValue}}
   {{promoDiscountType}}
   Ensure notification templates in the admin UI use these placeholders for dynamic content.
   Required Frontend Updates
5. Campaign Creation Flow
   Remove the "Status" dropdown from the creation form. Status should be inferred:
   "Launch Now" -> No startAt (or startAt = now).
   "Schedule" -> User picks startAt.
   Add "Promo Code" Section to Campaign Creation:
   Toggle: "Attach Promo Code?"
   Fields:
   Code (Optional, auto-generate if empty)
   Discount Type (Select: Percentage, Fixed Amount)
   Discount Value (Number input)
   Location Targeting (UI needed to select scoping, e.g., "Limit to specific venues/cities").
6. Campaign Management
   Add "End Campaign" Button:
   On the Campaign Details page, for Active campaigns.
   Action: Update campaign status to completed (or call specific end endpoint).
7. Venue Creation Flow
   Update Form:
   Add "Venue Type" dropdown with new options (Pharmacy, Supermarket, Store).
   Add "Owner Phone Number" input field.
   Remove any "Owner Email" field that was used for auto-creation, OR keep it but clarify it's just for record-keeping, not account generation.
   Venue Owner Setup:
   Implement a separate flow/button to "Invite/Create Owner" for a specific venue AFTER venue creation.
8. Notifications UI
   Template Editor:
   Update any help text or autocomplete to include new placeholders: {{venueName}}, {{promoDiscountValue}}, etc.
   API Payload Examples
   Create Campaign with Promo Code
   json
   POST /campaigns
   {
   "name": "Summer Sale",
   "startAt": "2024-06-01T00:00:00Z", // Future date = Scheduled
   "venueIds": ["..."],
   "promoCode": {
   "code": "SUMMER24",
   "discountType": "percentage",
   "discountValue": 20,
   "targetingConfiguration": {
   "region": "Lagos"
   }
   }
   }
   Create Manual Venue
   json
   POST /venues
   {
   "name": "Iya Titi Store",
   "primaryType": "store",
   "ownerPhoneNumber": "+2348012345678",
   "addressLine1": "..."
   // No auto-owner creation will happen
   }
