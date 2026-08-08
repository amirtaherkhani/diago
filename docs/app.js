const diagramTabs = document.querySelectorAll('[data-diagram-view]');
const diagramPanels = document.querySelectorAll('[data-view-panel]');
const installTabs = document.querySelectorAll('[data-install-tab]');
const installTitle = document.querySelector('[data-install-title]');
const installDescription = document.querySelector('[data-install-description]');
const installCommand = document.querySelector('[data-install-command]');
const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.site-nav');

const installOptions = {
  codex: {
    title: 'Install the Codex marketplace',
    description: 'Add the GitHub repository as a marketplace, then install the plugin with its skills and MCP tools.',
    command: 'codex plugin marketplace add amirtaherkhani/diago\ncodex plugin add diago@diago',
  },
  claude: {
    title: 'Install in Claude Code',
    description: 'Add the repository marketplace and install the namespaced skills and MCP tools from Claude Code.',
    command: '/plugin marketplace add amirtaherkhani/diago\n/plugin install diago@diago\n/reload-plugins',
  },
  mcp: {
    title: 'Connect the standard stdio MCP server',
    description: 'Clone Diago and register the same local MCP package with Codex or Claude Code. No cluster, HTTP endpoint, token, or API key is required.',
    command: 'git clone https://github.com/amirtaherkhani/diago.git\ncd diago\n\n# Codex\ncodex mcp add diago -- node "$PWD/mcp/server.mjs"\n\n# Claude Code\nclaude mcp add --transport stdio diago -- node "$PWD/mcp/server.mjs"',
  },
  cli: {
    title: 'Run the deterministic CLI',
    description: 'Clone the repository and use the advisor, reviewer, validator, and bundled renderer directly.',
    command: 'git clone https://github.com/amirtaherkhani/diago.git\ncd diago\nnode bin/diago.mjs doctor',
  },
};

function activateTab(tabs, activeTab, panels, attribute, panelAttribute) {
  tabs.forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab === activeTab));
  });
  panels.forEach((panel) => {
    panel.classList.toggle('is-active', panel.getAttribute(panelAttribute) === activeTab.getAttribute(attribute));
  });
}

diagramTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activateTab(diagramTabs, tab, diagramPanels, 'data-diagram-view', 'data-view-panel');
  });
});

installTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const selected = tab.getAttribute('data-install-tab');
    const option = installOptions[selected];
    installTabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
    installTitle.textContent = option.title;
    installDescription.textContent = option.description;
    installCommand.textContent = option.command;
  });
});

document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.getAttribute('data-copy-target'));
    const previous = button.textContent;
    try {
      await navigator.clipboard.writeText(target.innerText);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select text';
    }
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1600);
  });
});

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  siteNav.classList.toggle('is-open', !isOpen);
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
  });
});
