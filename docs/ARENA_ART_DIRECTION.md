# Arena presentation

The basketball UI now uses an arena photograph behind charcoal panels, the current club's actual crest, warm gold numeric values and a less condensed type hierarchy. A one-time appearance migration selects dark mode for the new design; users can select light mode again in Global Settings. League data is never migrated or rewritten by the appearance change.

Typography: FM24 skin references identify GT America Standard. The client uses a local-only GT America face when installed, with bundled Inter as the fallback. No commercial font binary is redistributed. Source: https://community.sports-interactive.com/forums/topic/579529-fm24skin-rensie-custom-skin/

## Generated artwork

Production asset: `public/img/clubhouse/arena-night.webp`.

Created with the built-in `image_gen` tool, then encoded as WebP at the original resolution. The club logo is rendered separately from actual league data; no generated branding or unrelated player portraits are used.

Final generation prompt:

> Create a premium photorealistic basketball arena background texture for a dense professional basketball management game interface. 16:9 wide landscape composition, NOT a UI mockup. Camera high in the lower stands looking diagonally over a full regulation basketball court. Correct hardwood court markings, visible hoops and backboards at both ends, large dark tiered arena seating, restrained warm gold spotlights, charcoal black atmosphere, muted amber hardwood with realistic subtle reflections. No people in foreground, no readable words, no lettering, no brands, no logos, no scoreboards with text. The center-court circle is blank, designed so the game can overlay the user's actual club crest dynamically. Strong basketball identity, cinematic documentary arena photograph, extremely polished AAA sports game art direction. Detail and architecture remain discernible in dark areas, not crushed black. Image should be dark and low contrast enough to sit behind translucent black information panels; center court and a hoop should still be clearly identifiable. Avoid neon, purple, gradients as subject, generic abstract sports graphics. Fill entire image with the arena, no margins, no border.
