# Weekly Logsheet Workflow Process (12 Weeks)

## Overview
A structured 12-week logging system for tracking progress, tasks, blockers, and learnings. Designed for individual or team use.

---

## Phase 1: Setup (Week 0 - Before Starting)

### 1.1 Choose Your Medium
| Option | Best For | Tools |
|--------|----------|-------|
| Digital Spreadsheet | Data analysis, filtering | Google Sheets, Excel, Notion |
| Markdown Files | Version control, developers | Git repo, Obsidian, VS Code |
| Dedicated App | Rich features, reminders | Notion, Obsidian, Logseq |
| Paper/Printable | Minimal distraction | Printed template, notebook |

### 1.2 Create Master Template
**File Structure (if using markdown):**
```
/logs
  /2026
    week-01.md
    week-02.md
    ...
    week-12.md
  README.md
  summary.md
```

**Template per week (`week-XX.md`):**
```markdown
# Week XX: [Date Range] - [Theme/Focus]

## Goals (Set Sunday/Monday)
- [ ] Goal 1: Specific, measurable outcome
- [ ] Goal 2: ...
- [ ] Goal 3: ...

## Daily Logs
### Monday
- **Completed:** 
- **In Progress:** 
- **Blockers:** 
- **Notes/Learnings:** 

### Tuesday
...

### Friday
...

### Weekend (Optional)
- **Review:** 
- **Prep for Next Week:** 

## Weekly Metrics
| Metric | Target | Actual | Delta |
|--------|--------|--------|-------|
| Hours Focused Work |  |  |  |
| Tasks Completed |  |  |  |
| Blockers Resolved |  |  |  |
| New Skills Learned |  |  |  |

## Retrospective (Friday/Weekend)
### What Went Well
- 

### What Didn't
- 

### Action Items for Next Week
- 

## Week Score: __/10
```

### 1.3 Define Categories/Tags
Standardize for filtering:
- **Type:** `feature`, `bug`, `research`, `meeting`, `admin`, `learning`
- **Project:** `client`, `server`, `infra`, `docs`, `other`
- **Priority:** `P0` (critical), `P1` (high), `P2` (medium), `P3` (low)
- **Status:** `done`, `in-progress`, `blocked`, `deferred`

---

## Phase 2: Weekly Execution (Weeks 1-12)

### 2.1 Sunday/Monday: Planning (15-30 min)
1. Review previous week's retrospective
2. Check carryover items
3. Set 3-5 specific goals for the week
4. Break goals into daily tasks
5. Identify potential blockers early

### 2.2 Daily: Logging (5 min/day, 10 min Friday)
**End of each workday:**
- Log completed tasks with time spent
- Note in-progress items
- Document blockers with context
- Capture 1-2 learnings/observations

**Friday Extended Session:**
- Complete weekly metrics table
- Write retrospective (15 min)
- Score the week
- Plan next week's goals

### 2.3 Weekly Review Checklist (Friday)
- [ ] All daily logs filled
- [ ] Metrics calculated
- [ ] Retrospective written
- [ ] Carryover items identified
- [ ] Next week goals drafted
- [ ] File committed/synced

---

## Phase 3: Monthly Checkpoints (Weeks 4, 8, 12)

### 3.1 Monthly Review (30-60 min)
**Aggregate from weekly logs:**
- Total hours by category/project
- Completion rate trends
- Recurring blockers
- Skill growth areas

**Questions to answer:**
- What patterns emerged?
- Which goals were consistently hit/missed?
- What process changes needed?
- Adjust next month's approach

### 3.2 Month-End Artifacts
- `summary-week-01-04.md`
- `summary-week-05-08.md`
- `summary-week-09-12.md`

---

## Phase 4: Final Synthesis (Week 12+)

### 4.1 12-Week Report
**Create:** `FINAL_12_WEEK_REPORT.md`

**Sections:**
1. **Executive Summary** (1 paragraph)
2. **Goals vs Outcomes** (table)
3. **Metrics Dashboard** (charts if digital)
4. **Key Learnings** (top 10)
5. **Blocker Analysis** (frequency, resolution time)
6. **Process Improvements** (what to keep/change)
7. **Next 12 Weeks Plan** (high-level)

### 4.2 Archive & Reset
- Move 12 weeks to `/archive/2026-Q4/`
- Create fresh template for next cycle
- Update process doc with improvements

---

## Automation Helpers (Optional)

### VS Code Snippet (`.vscode/logsheet.code-snippets`)
```json
{
  "Weekly Logsheet": {
    "prefix": "weeklog",
    "body": [
      "# Week ${1:XX}: ${2:Date Range} - ${3:Theme}",
      "",
      "## Goals",
      "- [ ] ${4:Goal 1}",
      "- [ ] ${5:Goal 2}",
      "- [ ] ${6:Goal 3}",
      "",
      "## Daily Logs",
      "### Monday",
      "- **Completed:** ",
      "- **In Progress:** ",
      "- **Blockers:** ",
      "- **Notes:** ",
      "",
      "### Tuesday",
      "- **Completed:** ",
      "- **In Progress:** ",
      "- **Blockers:** ",
      "- **Notes:** ",
      "",
      "### Wednesday",
      "- **Completed:** ",
      "- **In Progress:** ",
      "- **Blockers:** ",
      "- **Notes:** ",
      "",
      "### Thursday",
      "- **Completed:** ",
      "- **In Progress:** ",
      "- **Blockers:** ",
      "- **Notes:** ",
      "",
      "### Friday",
      "- **Completed:** ",
      "- **In Progress:** ",
      "- **Blockers:** ",
      "- **Notes:** ",
      "",
      "## Weekly Metrics",
      "| Metric | Target | Actual | Delta |",
      "|--------|--------|--------|-------|",
      "| Hours Focused Work | ${7:40} |  |  |",
      "| Tasks Completed | ${8:15} |  |  |",
      "| Blockers Resolved |  |  |  |",
      "| New Skills Learned |  |  |  |",
      "",
      "## Retrospective",
      "### What Went Well",
      "- ",
      "",
      "### What Didn't",
      "- ",
      "",
      "### Action Items for Next Week",
      "- ",
      "",
      "## Week Score: __/10"
    ],
    "description": "Generate weekly logsheet template"
  }
}
```

### Git Hook (`.git/hooks/prepare-commit-msg`)
Auto-remind to update logs on commit:
```bash
#!/bin/bash
echo "# Reminder: Did you update this week's logsheet?" > .git/COMMIT_EDITMSG
```

### Cron/Scheduled Reminder
```bash
# Friday 4pm reminder (macOS/Linux)
0 16 * * 5 osascript -e 'display notification "Update weekly logsheet" with title "Weekly Log"'

# Windows Task Scheduler: Friday 4pm -> run PowerShell script
```

---

## Quick Reference Card

| Day | Action | Time |
|-----|--------|------|
| Sun/Mon | Plan week, set goals | 15-30 min |
| Mon-Thu | Daily log | 5 min |
| Fri | Daily log + metrics + retrospective | 20-30 min |
| Week 4, 8 | Monthly review | 30-60 min |
| Week 12 | Final synthesis + archive | 60-90 min |

---

## Success Principles

1. **Consistency > Perfection** - 5 min daily beats 2 hours monthly
2. **Write for future you** - Include context so logs make sense later
3. **Blockers are data** - Track them, don't hide them
4. **Score honestly** - The score is for calibration, not judgment
5. **Review regularly** - Unread logs have zero value

---

## Customization Ideas

- Add **mood/energy tracking** (1-5 scale daily)
- Include **meeting notes** section
- Track **code commits/PRs** linked to tasks
- Add **health/habits** (sleep, exercise, breaks)
- Create **project-specific** sub-templates
- Build a **dashboard** (Notion, Grafana, custom React)

---

*Created: 2026-10-06 | Version: 1.0 | Adapt freely*