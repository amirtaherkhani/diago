# 🌱 Help more engineers discover Diago

[← Back to the README](../README.md#help-diago-grow)

A practical checklist for maintainers: make the first useful result easy to reach, show real examples, and give people a small way to join in. Treat these as experiments; compare results before deciding what to repeat.

## 1. Make the first visit count

- [ ] Keep the repository description focused on the audience and result: **“Evidence-grounded, interactive engineering diagrams for Codex and Claude Code.”**
- [ ] Review the existing topics for relevance, such as `architecture-diagrams`, `developer-tools`, `mcp`, `codex`, and `claude-code`. GitHub topics help people find related repositories. [GitHub topic guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).
- [ ] Set the repository's social preview in **Settings → General → Social preview**, using the [brand artwork](./assets/og-card.png). The website's Open Graph image and GitHub's repository preview are configured separately. [GitHub social-preview guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).
- [ ] Keep the demo link, installation steps, and release availability accurate after every release.

## 2. Show one small, reproducible win

Start with a concrete example such as **“Who owns retries in checkout?”**

- [ ] Share the question and the exact prompt.
- [ ] Show the resulting diagram or a short screen recording of its interactions.
- [ ] Link the example JSON and the instructions needed to reproduce it.
- [ ] Explain one engineering decision the diagram helped clarify.
- [ ] Remove private code, customer details, and credentials before sharing.

Suggested post structure:

```text
Question: [the engineering question]
Context: [a short description of the example]
Prompt: [the prompt you used]
Result: [a diagram or short recording]
What became clearer: [one specific observation]
Try it: [link to the example and Diago setup]
```

Share in relevant engineering communities that welcome project demos. Respond to questions with useful technical details and use that feedback to improve the example.

## 3. Make the first contribution approachable

- [ ] Prepare two or three bounded issues with a clear result, relevant files, and validation steps.
- [ ] Apply `good first issue` only to tasks a newcomer can reasonably finish, and `help wanted` where outside help is useful. GitHub uses these labels to surface contribution opportunities. [GitHub label guidance](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/encouraging-helpful-contributions-to-your-project-with-labels).
- [ ] Suggest small contributions: an example diagram, a clearer setup step, a prompt recipe, or an accessibility fix.
- [ ] Acknowledge reports, clarify expectations, and credit accepted contributions in release notes.

## 4. Learn from the response

For each demo or release, record the date, the example, the community, and the feedback. Compare repository visits and clones, demo interest where you already have measurements, useful issues, first pull requests, stars, and forks.

| Signal | Useful question |
| :--- | :--- |
| People visit but ask how to begin | Is the first setup step obvious and accurate? |
| People clone but report setup problems | Can a new user reproduce the quick start? |
| People star but do not try it | Is the example relevant to their work? |
| People fork but do not contribute | Is there a small, clearly scoped task to start with? |
| The same question keeps coming up | Can the README answer it earlier? |

Use the answers to choose the next improvement. Publish another example when it teaches something new.
