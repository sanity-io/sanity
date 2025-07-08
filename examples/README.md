# Sanity Examples

This directory contains comprehensive examples and reference implementations for various Sanity features and integrations. Whether you're building your first Sanity project or exploring advanced functionality, these examples provide practical code you can reference and adapt.

## 📁 Directory Structure

```text
examples/
├── functions/            # Sanity Functions examples
└── studios/              # Studio configuration examples
```

## 🔧 Functions

The `functions/` directory contains examples of [Sanity Functions](https://www.sanity.io/docs/compute-and-ai/functions-introduction) - serverless functions that run in Sanity's cloud environment.

**📖 [Complete Functions Documentation](./functions/README.md)** - Comprehensive guide covering implementation, testing, deployment, and troubleshooting for all functions.

### Available Function Examples

| Function                                                                 | Description                                             | Use Case                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------- |
| **[auto-tag](./functions/auto-tag/README.md)**                           | AI-powered automatic tagging for blog posts             | Content organization and discoverability |
| **[brand-voice-validator](./functions/brand-voice-validator/README.md)** | AI-powered content analysis and improvement suggestions | Content quality and brand consistency    |
| **[capture-tone-of-voice](./functions/capture-tone-of-voice/README.md)** | AI-powered tone of voice analysis and capture           | Content voice consistency                |
| **[first-published](./functions/first-published/README.md)**             | Automatic timestamp tracking for first publication      | Analytics and editorial workflows        |
| **[slack-notify](./functions/slack-notify/README.md)**                   | Automatic Slack notifications when content is published | Team communication and awareness         |

### Key Files

- **`sanity.blueprint.ts`** - Automatically discovers and configures all function examples for easy testing
- **`package.json`** - Shared dependencies for all function examples
- **`vite.config.js`** - Build configuration for bundling functions

### Documentation Structure

- **[Functions Overview](./functions/README.md)** - Central hub with implementation guides, testing instructions, and deployment procedures
- **Individual Function READMEs** - Function-specific details, schema requirements, and customization options

## 🎨 Studios

The `studios/` directory contains complete Sanity Studio configurations showcasing different use cases:

- **[Blog Studio](https://github.com/sanity-io/sanity/tree/marketing/add-examples-folder/examples/studios/blog-studio)** - Content management for blogs and editorial sites
- **[E-commerce Studio](https://github.com/sanity-io/sanity/tree/marketing/add-examples-folder/examples/studios/ecommerce-studio)** - Product catalogs and inventory management
- **[Clean Studio](https://github.com/sanity-io/sanity/tree/marketing/add-examples-folder/examples/studios/clean-studio)** - Clean project with no predefined schema types
- **[Movies Studio](https://github.com/sanity-io/sanity/tree/marketing/add-examples-folder/examples/studios/movies-studio)** - Movie database with sample content

Each studio example demonstrates schema design, custom components, and workflow configurations.

## 🚀 Getting Started

1. **Browse the examples** - Each directory contains detailed README files explaining the implementation
2. **Copy reference code** - Use the examples as starting points for your own projects
3. **Test locally** - Many examples include setup instructions for local development
4. **Adapt and extend** - Modify the examples to fit your specific use case

## 📖 Learning Resources

For comprehensive documentation and tutorials, visit:

- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Exchange](https://www.sanity.io/exchange) - Community plugins and starters

## 💡 Contributing

Found a bug or have an idea for a new example? Contributions are welcome! Please check the project's contribution guidelines before submitting pull requests.

---

**Note**: These examples are part of the Sanity monorepo and are designed for reference and learning. For production use, always review and adapt the code to meet your specific requirements and security standards.
