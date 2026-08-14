const PALETTE_SWATCHES = [
  { name: 'black', var: '--color-palette-black' },
  { name: 'white', var: '--color-palette-white' },
  { name: 'green24', var: '--color-palette-green24' },
  { name: 'grey46', var: '--color-palette-grey46' },
  { name: 'beige89', var: '--color-palette-beige89' },
  { name: 'red42', var: '--color-palette-red42' },
  { name: 'blue38', var: '--color-palette-blue38' },
];

const SPACING_STEPS = ['5xs', '4xs', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

function buildPaletteSection() {
  const section = document.createElement('div');
  section.className = 'token-showcase-section';
  section.innerHTML = '<h3>Branding — color palette (styles/tokens/branding/default.css)</h3>';

  const grid = document.createElement('div');
  grid.className = 'token-showcase-swatch-grid';
  PALETTE_SWATCHES.forEach(({ name, var: cssVar }) => {
    const swatch = document.createElement('div');
    swatch.className = 'token-showcase-swatch';
    swatch.innerHTML = `
      <span class="token-showcase-swatch-color" style="background-color: var(${cssVar})"></span>
      <span class="token-showcase-swatch-label">${name} (${cssVar})</span>
    `;
    grid.append(swatch);
  });
  section.append(grid);
  return section;
}

function buildSpacingSection() {
  const section = document.createElement('div');
  section.className = 'token-showcase-section';
  section.innerHTML = '<h3>Spacing scale (styles/tokens/core/spacing.css, small breakpoint)</h3>';

  const list = document.createElement('div');
  list.className = 'token-showcase-spacing-list';
  SPACING_STEPS.forEach((step) => {
    const row = document.createElement('div');
    row.className = 'token-showcase-spacing-row';
    row.innerHTML = `
      <span class="token-showcase-spacing-label">--spacing-${step}</span>
      <span class="token-showcase-spacing-bar" style="width: var(--spacing-${step})"></span>
    `;
    list.append(row);
  });
  section.append(list);
  return section;
}

function buildTypographySection() {
  const section = document.createElement('div');
  section.className = 'token-showcase-section';
  section.innerHTML = `
    <h3>Typography (styles/tokens/core/typography.css)</h3>
    <p class="token-showcase-type-sample token-showcase-type-label-md">Label / Medium — --font-primary-label-md</p>
    <p class="token-showcase-type-sample token-showcase-type-display-sm">Display <em>Italic</em> — --font-secondary-display-sm</p>
    <p class="token-showcase-type-sample token-showcase-type-display-lg">Display / Large — --font-primary-display-lg</p>
    <p class="token-showcase-type-sample token-showcase-type-display-xl">Display / Extra Large — --font-primary-display-xl</p>
  `;
  return section;
}

function buildButtonSection() {
  const section = document.createElement('div');
  section.className = 'token-showcase-section';
  section.innerHTML = '<h3>Button component (styles/tokens/component/input/button/{primary,secondary}.css)</h3>';

  const row = document.createElement('div');
  row.className = 'token-showcase-button-row';

  const primary = document.createElement('button');
  primary.type = 'button';
  primary.className = 'ap-button-primary--normal';
  primary.textContent = 'Primary CTA';

  const secondary = document.createElement('button');
  secondary.type = 'button';
  secondary.className = 'ap-button-secondary--normal';
  secondary.textContent = 'Secondary CTA';

  row.append(primary, secondary);
  section.append(row);
  return section;
}

export default function decorate(block) {
  block.textContent = '';
  block.append(
    buildPaletteSection(),
    buildSpacingSection(),
    buildTypographySection(),
    buildButtonSection(),
  );
}
