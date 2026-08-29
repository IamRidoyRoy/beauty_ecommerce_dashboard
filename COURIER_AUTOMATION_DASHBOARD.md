# Courier Automation Dashboard

The dashboard now controls Pathao, Steadfast, RedX and CarryBee from **Settings -> Courier Integrations**.

Available controls include Active/Inactive, Sandbox/Live where supported, encrypted credential updates, Test Connection, auto-book enablement, auto-book trigger status and provider priority.

Operational controls are in **Sales -> Shipments**: manual booking, live tracking sync, supported cancellation/return actions, filtering and courier event history.

See the backend project's `COURIER_AUTOMATION_SETUP.md` for migration, Celery, webhook, security and provider setup instructions.


## CarryBee

In **Settings -> Courier Integrations -> CarryBee**, configure Sandbox and Live separately using Client ID, Client Secret, Client Context and Pickup Store ID. Keep Sandbox mode ON while testing.

Recommended test sequence:

1. Save Sandbox credentials and press **Test Connection**.
2. Turn **Active** ON.
3. Keep **API cancel** OFF for the first booking test.
4. Book a test order from **Sales -> Shipments**. The backend auto-resolves CarryBee city/zone from the order address.
5. If CarryBee cannot resolve the address, retry booking with the optional City ID / Zone ID / Area ID fields shown for CarryBee.
6. Verify Track/Sync and webhook updates.
7. Test cancellation in Sandbox, then explicitly enable **API cancel** if the merchant account supports it as expected.
8. Only after UAT, save Live credentials and turn Sandbox mode OFF.

CarryBee webhook URL: `/api/v1/courier/webhooks/carrybee/`.
