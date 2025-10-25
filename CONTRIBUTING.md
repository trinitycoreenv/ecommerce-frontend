# Contributing to E-Commerce Multi-Vendor Marketplace

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

We welcome contributions in the form of:

- 🐛 Bug reports
- ✨ Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions
- 🧪 Test improvements
- 🎨 UI/UX enhancements

## 📋 Before You Start

1. **Check existing issues**: Look through existing issues to see if your bug/feature has already been reported
2. **Read the documentation**: Familiarize yourself with the project structure and setup
3. **Set up your development environment**: Follow the `SETUP_GUIDE.md`

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Clear title**: Describe the issue concisely
2. **Description**: Detailed description of the bug
3. **Steps to reproduce**: Step-by-step instructions
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Environment**:
   - OS (Windows/macOS/Linux)
   - Node.js version
   - PostgreSQL version
   - Browser (if frontend issue)
7. **Screenshots**: If applicable
8. **Error messages**: Full error messages and stack traces

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 11]
- Node.js: [e.g., 18.17.0]
- PostgreSQL: [e.g., 15.3]
- Browser: [e.g., Chrome 120]

**Additional Context**
Any other context about the problem.
```

## ✨ Requesting Features

When requesting features, please include:

1. **Clear title**: Describe the feature concisely
2. **Problem statement**: What problem does this solve?
3. **Proposed solution**: How should it work?
4. **Alternatives considered**: Other approaches you've thought about
5. **Use cases**: Real-world scenarios where this would be useful
6. **Mockups/Examples**: If applicable

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
What other approaches have you considered?

**Use Cases**
Real-world scenarios where this would be useful.

**Additional Context**
Any other context, mockups, or examples.
```

## 🔧 Code Contributions

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/coretransanction3.git
   cd coretransanction3
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/dfqhqw33q/coretransanction3.git
   ```
4. **Install dependencies**:
   ```bash
   pnpm install
   ```
5. **Set up environment**: Follow `SETUP_GUIDE.md`

### Development Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**:
   ```bash
   # Run tests
   pnpm test
   
   # Run linter
   pnpm lint
   
   # Test locally
   pnpm dev
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug in checkout"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(checkout): add shipping address validation
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
style(vendor): format product listing component
refactor(api): optimize database queries
test(orders): add unit tests for order creation
chore(deps): update dependencies
```

### Code Style Guidelines

1. **TypeScript**:
   - Use TypeScript for all new code
   - Define proper types and interfaces
   - Avoid `any` type when possible

2. **React Components**:
   - Use functional components with hooks
   - Use meaningful component names
   - Keep components small and focused
   - Use proper prop types

3. **File Naming**:
   - Components: `PascalCase.tsx`
   - Utilities: `camelCase.ts`
   - API routes: `route.ts`
   - Pages: `page.tsx`

4. **Code Organization**:
   - Group related code together
   - Use barrel exports (index.ts)
   - Keep files under 300 lines when possible

5. **Comments**:
   - Write self-documenting code
   - Add comments for complex logic
   - Use JSDoc for functions and components

### Pull Request Guidelines

1. **PR Title**: Use conventional commit format
2. **Description**: Clearly describe what and why
3. **Link Issues**: Reference related issues
4. **Screenshots**: Include for UI changes
5. **Testing**: Describe how you tested
6. **Breaking Changes**: Clearly mark breaking changes

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## How Has This Been Tested?
Describe the tests you ran.

## Screenshots (if applicable)
Add screenshots here.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write tests for new features
- Write tests for bug fixes
- Aim for high code coverage
- Test edge cases
- Use descriptive test names

## 📝 Documentation

When contributing documentation:

1. **Use clear language**: Write for beginners
2. **Include examples**: Show, don't just tell
3. **Keep it updated**: Update docs with code changes
4. **Check formatting**: Use proper Markdown
5. **Test instructions**: Verify steps work

## 🎨 UI/UX Contributions

When contributing UI/UX changes:

1. **Follow design system**: Use existing components
2. **Maintain consistency**: Match existing styles
3. **Test responsiveness**: Check mobile, tablet, desktop
4. **Test accessibility**: Ensure WCAG compliance
5. **Include screenshots**: Show before/after

## 🔍 Code Review Process

1. **Automated checks**: CI/CD runs tests and linting
2. **Maintainer review**: A maintainer reviews your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## 📦 Database Changes

When making database changes:

1. **Create migration**:
   ```bash
   pnpm db:migrate
   ```

2. **Update seed data** if needed:
   - Edit `prisma/seed.ts`

3. **Test migration**:
   ```bash
   pnpm db:reset
   ```

4. **Document changes**: Update schema documentation

## 🚀 Release Process

Releases are handled by maintainers:

1. Version bump following [Semantic Versioning](https://semver.org/)
2. Update CHANGELOG.md
3. Create GitHub release
4. Deploy to production

## 🏆 Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the project

## 📞 Getting Help

If you need help:

1. **Check documentation**: README.md, SETUP_GUIDE.md
2. **Search issues**: Look for similar questions
3. **Ask questions**: Create a discussion or issue
4. **Be patient**: Maintainers are volunteers

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior**:
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive behavior may be reported to the project maintainers. All complaints will be reviewed and investigated.

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Thank You!

Thank you for contributing to this project! Every contribution, no matter how small, is valuable and appreciated.

---

**Happy Contributing!** 🎉
