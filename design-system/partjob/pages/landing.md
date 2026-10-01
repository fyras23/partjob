# Landing Page Direction

## Page-Specific Decisions

- Use a full-bleed campus collaboration photograph as the first-viewport visual. Keep the PartJob petrol/terracotta identity, type scale, light/dark theme, contrast and spacing tokens from `MASTER.md`.
- Place a solid theme-token scrim over the photo so the headline, search controls and login requirement remain readable in both themes.
- Use subtle photo drift in standard motion settings. Under `prefers-reduced-motion`, render the photo at rest. Benefit and process icons respond gently to hover and enter the viewport without shifting layout.
- Keep the hero promotional, but do not show public job records: no cards, titles, employer names, listing counts or job images. Guests must sign in before seeing listings or job details.
- Keep keyword/city search as the primary CTA. Preserve the query through the login redirect, then show the benefits, application-to-messaging flow, and recruiter CTA below the hero.# Landing Page Direction

## Page-Specific Decisions

- Use a full-width campus collaboration photograph as the first-viewport visual. Keep the PartJob petrol/terracotta identity, typography, light/dark theme, and contrast tokens from `MASTER.md`.
- Apply a solid theme-token scrim over the photograph so headline and search remain readable. The background image may move slowly; disable that motion when reduced motion is requested.
- Keep the hero promotional, but preserve the access rule: guest users may search, yet must sign in before viewing job records, details, or recruiter information. Preserve the requested search URL through sign-in.
- Do not render job cards, job counts, recruiter names, or job imagery on the public landing page.
- Use a compact, above-the-fold keyword/city search as the primary action. Follow it with unframed benefit points, the application-to-messaging steps, and the recruiter call to action.
- Animate the photo subtly and animate icon affordances on hover/entry only; keep controls stable, keyboard accessible, and within the existing reduced-motion behavior.