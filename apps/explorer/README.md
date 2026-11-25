# Alephium Explorer - frontend

A blockchain explorer frontend for Alephium.

## Features

- Switch between main and test networks
- Search for an address or transaction
- List blocks
  - Hash, timestamp, height, number of TX, and chain index
- Transaction view
  - Hash, status, block hash, timestamp, inputs, outputs, gas, TX fee
- Address view
  - Address, number of transactions, total balance, locked balance, history
  - Known mainnet wallet names from [address2name](https://github.com/sven-hash/address2name/blob/main/know-walletsv2.json)
- Statistics
  - Hashrate, supply, transactions, blocks, number of chains

## Development

Start by following the development instructions in the [README](/README.md) of the monorepo.

Then, create an `.env` file following the template and add values the environmental variables. You can use our [public services](https://docs.alephium.org/dapps/public-services) or your local servers.

```shell
cp .env.example .env
```

Then, start the app:

```shell
pnpm start
```

## Releasing

### GitHub Pages

1. In your GitHub repository, open **Settings → Pages** and select **GitHub Actions** as the deployment source.
2. Push the explorer changes to `main` or `master` to deploy automatically. You can also open
   **Actions → Deploy explorer to GitHub Pages → Run workflow** to deploy manually.
3. Open the site URL shown by the deployment when the workflow completes.

The workflow installs the explorer's dependencies, runs its lint and tests, and builds it against the public mainnet services.
Changes to the explorer, its shared packages, or its build configuration trigger deployment; wallet-only changes do not.
It detects the Pages base path automatically
and uses hash routing so address, transaction, and block links work when opened directly or refreshed.
No AWS credentials are needed.

Known wallet names are fetched in the browser and cached for one hour. Unlisted addresses and failed lookups display the
original address. Links, clipboard actions, and transaction exports always use the original address. Names are only shown
on mainnet.

Names appear beside the full address in page headings and beside a shortened address in tables when space allows.
Narrow table cells prioritize the name; the full address is available on hover and through the copy action.
Unnamed mainnet address pages include a **Recognize this address?** link to the GitHub list, inviting visitors to
contribute a name and help others identify the address.

To build locally for Pages, set the backend variables from `.env.example` and run `pnpm run build:gh-pages`.
The default base path is `/explorer/`; set `EXPLORER_BASE_PATH` to override it (for example, `/alephium-frontend/` or `/`).

### Docker and AWS

Follow the same [instructions as in the desktop wallet](../desktop-wallet/README.md). The only difference is that pushing a production tag will trigger the workflow to build and publish the Docker image. It will not deploy the explorer frontend to production. This is done by manually triggering the corresponding workflow from the GitHub interface.
