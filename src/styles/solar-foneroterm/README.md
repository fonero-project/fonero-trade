solar-foneroterm
--------------

Solar-foneroterm is a fork of solar-foneroorg which is a theme layer for the solar css framework.

It themes solar to Fonero Development Foundation's branding by adding a [theme layer](https://github.com/fonero-project/solar/blob/master/docs/architecture.md#modules-and-themes) on solar.

The lib/_index.scss and styles/_index.scss files are loaded after each of their respective core modules. The solar-foneroorg/lib/_index.scss file is loaded before solar-css/styles/_index.scss so that this theme library can affect core styles with variables.

This theme is not limited to use in interfonero. It is also used on other Foneroorg projects. While anyone can use solar-foneroorg, development of solar-foneroorg is targeted for use by Foneroorg itself. Feel free to fork and develop into your own theme.

## What lives in the foneroorg theme?
- **variables**: theming variables that other css code uses (colors, padding, border-radius)
- **typography**: overrides for scale, typography, and custom fonts
- **organization global sprites/icons**: small sprites used globally throughout the Foneroorg brand, such as the Fonero rocket or [stroopy and friends](https://www.fonero.org/stories/adventures-in-galactic-consensus-chapter-1/)
- **custom**: any other styles to be used across multiple Foneroorg projects
