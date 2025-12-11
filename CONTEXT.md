# Project Context

## Important Working Guidelines

### Workflow
- **We are working directly on the live server, not on localhost**
- Always commit changes to GitHub first, then deploy to the live server
- Never work directly on localhost - all changes go through GitHub → Live Server

### Solution Philosophy
- All fixes and solutions should be **permanent, simple, and locally executable**
- **Avoid temporary fixes** at all costs
- Prioritize **practicality and stability** over complexity
- Keep solutions straightforward - avoid overly complex or abstract implementations

### Before Starting Any Task
1. Always read the documentation files first:
   - README.md
   - Setup files
   - Environment files
2. Look for critical information:
   - SSH credentials
   - PostgreSQL access details
   - Configuration notes
   - Server deployment information

### Key Technical Details
- **Database:** PostgreSQL on remote server (147.93.123.174)
- **Deployment:** Remote server deployment via SSH
- **Version Control:** Git with GitHub as remote repository

## Reference Files
- Check README.md for setup and deployment procedures
- Check .env files for environment configuration
- Check package.json for available scripts and dependencies
