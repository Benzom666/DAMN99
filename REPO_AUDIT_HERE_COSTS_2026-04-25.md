# Repo Audit: HERE API Cost Optimization And Super Admin Cost Analytics

Date: 2026-04-25

## Scope Completed In This Session

Audited the main HERE API cost surfaces across the repo and implemented root-cause cost controls for geocoding, routing, tour planning, map rendering, and super-admin monitoring.

## Highest Cost Root Causes Found

1. Browser map road polylines were extremely expensive.
   - `components/here-map.tsx` called HERE Routing once per route segment through `segmentShape()`.
   - Dispatch and route detail pages explicitly enabled road polylines, so a 100-stop route could generate about 99 Routing calls just by opening the map.
   - Fixed by defaulting `useRoadPolylines` to `false` and changing admin route/dispatch views to straight polylines.

2. Route metrics always called HERE Routing.
   - `app/admin/routes/metrics.ts` used HERE Routing to calculate distance and duration.
   - Fixed by making HERE metrics opt-in with `HERE_ROUTING_METRICS_ENABLED=true`; otherwise the app uses local haversine distance with a configurable road factor/speed estimate.

3. Geocoding happened too often and too aggressively.
   - Creating an order always geocoded.
   - Updating an order always geocoded even if the address did not change.
   - CSV import used batches of 25 concurrent calls.
   - Route creation geocoding used multiple retries per order.
   - Fixed by skipping geocoding on updates when address fields are unchanged, adding in-memory request dedupe, lowering default geocode batch size to 5, adding configurable delays/retries, and recording geocode metadata.

4. HERE Tour Planning had no persistent telemetry or budget guard.
   - There was only an in-memory rate limiter, which does not protect across serverless instances or deploys.
   - Fixed by adding persistent `here_api_usage` telemetry and budget/request-limit checks.

5. No real-time cost visibility existed.
   - Super admins could not see HERE request volume, cache hits, blocked calls, errors, or estimated spend.
   - Fixed by adding `/super-admin/costs` and a 24h HERE cost card on `/super-admin`.

## Files Changed

Cost controls and telemetry:
- `lib/here/cost-control.ts`
- `lib/here/routing.ts`
- `lib/here/tour-planning.ts`
- `lib/geocoding.ts`
- `lib/here/geocoding.ts`
- `lib/geocode-here.ts`
- `lib/ensure-coords.ts`

Cost-saving product behavior:
- `components/here-map.tsx`
- `app/admin/dispatch/dispatch-monitor.tsx`
- `app/admin/routes/[id]/route-detail-view.tsx`
- `app/admin/routes/metrics.ts`
- `app/admin/orders/actions.ts`
- `app/admin/routes/actions.ts`

Super admin analytics:
- `app/super-admin/actions.ts`
- `app/super-admin/page.tsx`
- `app/super-admin/layout.tsx`
- `app/super-admin/costs/page.tsx`
- `app/super-admin/costs/auto-refresh.tsx`

Database migration:
- `database/021_here_api_cost_analytics.sql`
- `scripts/021_here_api_cost_analytics.sql`

## New Database Table

`public.here_api_usage` logs:
- service: `geocoding`, `routing`, `tour_planning`, `maps_js`, `unknown`
- operation
- admin/user/route/order references
- request count and unit count
- estimated cost in cents
- status: `success`, `error`, `blocked`, `cache_hit`
- HTTP status, cache-hit flag, metadata, error message, timestamp

Run migration `021_here_api_cost_analytics.sql` before relying on the dashboard or persistent budget checks.

## New Environment Controls

Cost estimate rates, all in cents per 1000 units:
- `HERE_GEOCODING_COST_PER_1000_CENTS`
- `HERE_ROUTING_COST_PER_1000_CENTS`
- `HERE_TOUR_PLANNING_COST_PER_1000_CENTS`
- `HERE_MAPS_JS_COST_PER_1000_CENTS`

Budget/request guards:
- `HERE_DAILY_BUDGET_CENTS`
- `HERE_GEOCODING_DAILY_BUDGET_CENTS`
- `HERE_ROUTING_DAILY_BUDGET_CENTS`
- `HERE_TOUR_PLANNING_DAILY_BUDGET_CENTS`
- `HERE_GEOCODING_DAILY_REQUEST_LIMIT`
- `HERE_ROUTING_DAILY_REQUEST_LIMIT`
- `HERE_TOUR_PLANNING_DAILY_REQUEST_LIMIT`

Geocoding throttle controls:
- `HERE_GEOCODING_BATCH_SIZE` default `5`, capped at `10`
- `HERE_GEOCODING_BATCH_DELAY_MS` default `1000`
- `HERE_GEOCODING_REQUEST_DELAY_MS` default `250`
- `HERE_GEOCODING_RETRIES` default `1`, capped at `2`

Routing metrics:
- `HERE_ROUTING_METRICS_ENABLED=true` to use paid HERE Routing for metrics
- `ROUTE_METRICS_FALLBACK_SPEED_KMH` default `35`

## Important Behavior Changes

1. Route and dispatch maps now draw straight-line route polylines by default.
   - This avoids one paid Routing call per stop-to-stop segment.
   - Road-snapped polylines can still be enabled by passing `useRoadPolylines={true}`, but do that only behind an explicit paid feature or admin action.

2. Route metrics no longer require HERE Routing by default.
   - Distance is estimated from haversine distance times `1.25`.
   - Duration is estimated from `ROUTE_METRICS_FALLBACK_SPEED_KMH`.

3. Costs on the dashboard are estimates.
   - The implementation intentionally avoids hard-coding HERE pricing.
   - Configure the per-1000 cent environment variables from the current HERE contract/pricing page.

## Verification Performed

Ran:

```bash
pnpm exec tsc --noEmit
```

Result: TypeScript still fails, but the remaining failures are repo-wide pre-existing type issues. The touched `HereMap` nullability issues and `OptimizationConfig.returnToDepot` mismatch were fixed during this session.

Remaining TypeScript failures at the end of this session:
- `app/admin/routes/create-route-dialog.tsx`: invalid `unassigned` status comparison; `Profile` type missing `vehicle_capacity`
- `app/api/driver/deliver/route.tsx`: Supabase relation typed as array, `driver_id` access fails
- `app/api/driver/fail/route.ts`: same `driver_id` relation typing issue
- `app/api/geocode/route.ts`: expects `ensureOrderCoordinates().success`, but function returns `{ orders, failed }`
- `app/api/test-email/route.tsx`: `NextRequest.searchParams` usage should be `request.nextUrl.searchParams`
- `app/driver/routes/[id]/route-detail.tsx`: passes unsupported `showToggle` prop to `HereMap`
- `app/super-admin/routes/routes-table.tsx`: relation result type missing `id`
- `app/test-map/page.tsx`: passes unsupported `center` prop to `HereMap`
- `lib/here/build-problem-v3.ts`: `parseLocalDateTime()` receives possibly undefined shift values
- `lib/security/authorization.ts`: Supabase relation typed as array, `driver_id` access fails
- `lib/supabase/client.ts`, `middleware.ts`, `server.ts`: import `Database` from `lib/types.ts`, but `Database` is not exported

## Recommended Next Session Priorities

1. Run migration `021_here_api_cost_analytics.sql` in the target database.
2. Configure HERE rate/cost env vars using the actual HERE contract/pricing values.
3. Fix the TypeScript failures listed above so `pnpm exec tsc --noEmit` becomes a required gate.
4. Consider moving HERE map SDK key usage to a restricted browser key and server calls to a separate server-only key.
5. Add a paid/explicit "road snap route" button if road polylines are needed, instead of automatic rendering.
6. Replace in-memory geocode/route caches with a persistent cache table if high traffic or serverless multi-instance deployment is expected.
7. Add alerting when `here_api_usage.status='blocked'` or daily cost passes a warning threshold.
