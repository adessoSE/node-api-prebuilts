## 🚧 **UNDER CONSTRUCTION** 🚧
# `node-api-prebuilts`

A CLI and library to manage, locate and load prebuilt node addons targetting [Node-API].
The tool should be used as a post-build step to copy the native addon into a
directory structure which disambiguates the binaries by their triplets.
So it serves a similar purpose to [`prebuildify`] and [`pkg-prebuilds`].

Design goals:
  * don't drag in any "unnecessary" dependencies (see [below](#no-unnecessary-dependencies))
  * be build-system agnostic
  * no magic / explicit configuration over guesswork
  * be lightweight
  * provide typed APIs for CLI commands

Non-goals:
  * Support node addons implemented with nan / V8 / libuv APIs


## Usage

```sh
yarn add @adesso-se/node-api-prebuilts
# -- OR -- #
npm install --save @adesso-se/node-api-prebuilts
```


## No unnecessary Dependencies
At its core this libray has one job: Locate (and load) a native node addon for
the execution triplet. Therefore we only want to depend on packages that
directly help with this task and are stable. It is also quite annoying to
retrieve deprecation/security notices about libraries which are only ever used
by install scripts. This implies that we can't use `yargs` and the like to parse
CLI arguments.


## License

[MIT License](https://choosealicense.com/licenses/mit/)


[Node-API]: https://nodejs.org/dist/latest-v16.x/docs/api/n-api.html#node-api
[`prebuildify`]: https://www.npmjs.com/package/prebuildify
[`pkg-prebuilds`]: https://www.npmjs.com/package/pkg-prebuilds
