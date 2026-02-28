# ArgentGrid Storybook

Interactive component documentation and testing environment for ArgentGrid.

## 🚀 Quick Start

```bash
# Start Storybook dev server
npm run storybook

# Open in browser
open http://localhost:6006
```

## 📖 Available Stories

### Basic Stories

- **Default** - Basic grid with 100 rows
- **Large Dataset** - 100K rows demonstrating performance

### Live Updates

- **Stock Ticker** - Real-time stock prices (10 updates/sec)
- **Log Stream** - Real-time log streaming (100 logs/sec)

### Theming

- **Light Theme** - Default Quartz light theme
- **Dark Theme** - Dark color scheme
- **Custom Theme** - Custom accent colors
- **Material Icons** - Material Design icon set
- **Compact Mode** - Dense data display

## 🧪 Running Tests

```bash
# Run E2E tests against Storybook
npm run test:e2e

# Run tests in CI mode
CI=true npm run test:e2e
```

## 📦 Building for Production

```bash
# Build Storybook static files
npm run build-storybook

# Output: ./storybook-static
```

## 🌐 Deployment

Storybook is automatically deployed to GitHub Pages on every push to main:

**URL:** https://hainanzhao.github.io/ArgentGrid/

## 📝 Creating New Stories

1. Create file in `src/stories/YourFeature.stories.ts`
2. Follow existing story patterns
3. Add E2E tests in `e2e/storybook.spec.ts`

### Example Story

```typescript
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule } from 'argent-grid';

const meta: Meta<ArgentGridComponent> = {
  title: 'ArgentGrid/YourFeature',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule],
    }),
  ],
};

export default meta;
type Story = StoryObj<ArgentGridComponent>;

export const Default: Story = {
  args: {
    columnDefs: [...],
    rowData: [...],
    height: '500px',
  },
};
```

## 🎯 Benefits

- **Isolated Testing** - Test features in isolation
- **Visual Regression** - Catch UI changes early
- **Documentation** - Living documentation with examples
- **Performance Testing** - Test with different data sizes
- **E2E Testing** - Automated testing against stories

## 🔗 Links

- [Storybook Docs](https://storybook.js.org/docs)
- [ArgentGrid Docs](../docs/)
