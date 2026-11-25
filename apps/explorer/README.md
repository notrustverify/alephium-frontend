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
2. Set **Custom domain** to `frontend.alephium.notrustverify.ch` and save it.
3. At your DNS provider, create a `CNAME` record for `frontend.alephium.notrustverify.ch` pointing to
   `notrustverify.github.io` (without a repository path).
4. Push the explorer changes to `main` or `master` to deploy automatically. You can also open
   **Actions → Deploy explorer to GitHub Pages → Run workflow** to deploy manually.
5. Enable **Enforce HTTPS** in Pages settings when the certificate is ready, then open
   [frontend.alephium.notrustverify.ch](https://frontend.alephium.notrustverify.ch).

The workflow installs the explorer's dependencies, runs its lint and tests, and builds it against the public mainnet services.
The build job uploads the site, then a separate deployment job publishes it to avoid an artifact visibility race.
Artifacts are named per build attempt so a full rerun does not create duplicate names. If only deployment fails,
rerun the failed deployment job to reuse the existing build, or start a new workflow run if the artifact has expired.
Changes to the explorer, its shared packages, or its build configuration trigger deployment; wallet-only changes do not.
It builds with a root base path (`/`) for the custom domain and uses hash routing so address, transaction, and block links
work when opened directly or refreshed.
No AWS credentials are needed.

GitHub Actions deployments use the custom domain configured in Pages settings; a `CNAME` file in the build output is not
required. See [GitHub's custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

Known wallet names are fetched in the browser and cached for one hour. Unlisted addresses and failed lookups display the
original address. Links, clipboard actions, and transaction exports always use the original address. Names are only shown
on mainnet.

Names appear beside the full address in page headings and beside a shortened address in tables when space allows.
Narrow table cells prioritize the name; the full address is available on hover and through the copy action.
Unnamed mainnet address pages include a **Recognize this address?** button that opens a contribution form.
The address and any existing category are prefilled. Visitors enter a name and can optionally add a category
and a public supporting URL. The form validates the address and blocks suggestions for addresses that already have a name.
Groupless addresses use the base address without a `:group` suffix for names, links, copies, and contributions.
**Continue on GitHub** opens a prefilled issue in `sven-hash/address2name`; the visitor signs in and submits it
on GitHub. Opening the draft does not submit the suggestion or change the registry. A maintainer reviews the
request and updates `know-walletsv2.json` before the name can appear in the explorer. Ownership claims link
to the repository's signature verification guide and are not automatically marked as verified.

This flow works directly on GitHub Pages without a backend, token, or additional deployment configuration.

Wallet labels use the list's `name` field and display category tags from `type`, such as **Exchange**, **Pool**, or **Miner**.
The `exchangename` field is not used. When `name` is empty, the address and contribution button remain visible.

To build locally for Pages, set the backend variables from `.env.example` and run `pnpm run build:gh-pages`.
The default base path is `/`; set `EXPLORER_BASE_PATH` to override it for a repository subpath, such as `/alephium-frontend/`.

### Automatic upstream updates

**Sync upstream and deploy explorer** checks `alephium/alephium-frontend`'s `master` branch every two days at
04:17 UTC. A daily timer gates the actual upstream check on alternating UTC days, including across month boundaries.
It can also be started manually from Actions. Enable the workflow in the fork if GitHub has disabled schedules.

When upstream has new commits, the workflow merges them into a temporary checkout of this fork's default branch,
preserving the wallet-name feature. It runs the explorer's lint, tests, typecheck, and production build before pushing
the merge. Conflicts, failed checks, and concurrent branch changes stop the update without force-pushing.
If upstream has no new commits, dependency installation and deployment are skipped.

After a successful push, the workflow explicitly starts **Deploy explorer to GitHub Pages**. The merge commit skips
duplicate push workflows, including unrelated wallet builds. Node and pnpm versions come from the merged source.

The built-in `GITHUB_TOKEN` is used by default. If GitHub rejects an upstream update that changes workflow files,
add an `UPSTREAM_SYNC_TOKEN` repository secret with access to this fork and **Contents: write** and **Workflows: write**
permissions, then rerun the failed workflow. Protected branch rules still apply. If deployment dispatch fails after a
successful push, run **Deploy explorer to GitHub Pages** manually to publish the already validated commit.

GitHub schedules are approximate and public-repository schedules can be disabled after 60 days of inactivity.
See [GitHub's schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

### Docker and AWS

Follow the same [instructions as in the desktop wallet](../desktop-wallet/README.md). The only difference is that pushing a production tag will trigger the workflow to build and publish the Docker image. It will not deploy the explorer frontend to production. This is done by manually triggering the corresponding workflow from the GitHub interface.
