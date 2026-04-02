# @treesap/cli

Command-line interface for Treesap tooling.

## Usage

```sh
npx @treesap/cli --help
```

## Image Optimization

```sh
treesap image optimize \
  --input ./src/images \
  --output ./public/images \
  --format avif \
  --size sm:640 \
  --size md:1280 \
  --size lg:1920@90 \
  --quality 85
```

## Size syntax

- `sm:640` => suffix `sm`, width `640`
- `lg:1920@90` => suffix `lg`, width `1920`, quality `90`
