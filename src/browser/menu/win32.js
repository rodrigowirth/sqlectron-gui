import shell from 'shell';


export function buildTemplate(app, buildNewWindow, appConfig) {
  return [
    {
      'label': 'File',
      'submenu': [
        {
          label: 'New Window',
          accelerator: 'Ctrl+N',
          click: () => buildNewWindow(app),
        },
        {
          label: 'New Tab',
          accelerator: 'Ctrl+T',
          click: (item, win) => win.webContents.send('sqlectron:new-tab'),
        },
        {
          type: 'separator',
        },
        {
          label: 'Save Query',
          accelerator: 'Ctrl+S',
          click: (item, win) => win.webContents.send('sqlectron:save-query'),
        },
        {
          type: 'separator',
        },
        {
          'label': 'Quit',
          'accelerator': 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Query',
      submenu: [
        {
          label: 'Execute',
          accelerator: 'Ctrl+Enter',
          click: (item, win) => win.webContents.send('sqlectron:query-execute'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Ctrl+Z',
          selector: 'undo:',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Ctrl+Z',
          selector: 'redo:',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'Ctrl+X',
          selector: 'cut:',
        },
        {
          label: 'Copy',
          accelerator: 'Ctrl+C',
          selector: 'copy:',
        },
        {
          label: 'Paste',
          accelerator: 'Ctrl+V',
          selector: 'paste:',
        },
        {
          label: 'Select All',
          accelerator: 'Ctrl+A',
          selector: 'selectAll:',
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: (item, win) => win.reloadIgnoringCache(),
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Ctrl+I',
          click: (item, win) => win.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Report Issue',
          click: () => shell.openExternal(appConfig.bugs),
        },
        {
          'label': `About ${appConfig.name}`,
          click: () => shell.openExternal(appConfig.homepage),
        },
      ],
    },
  ];
}
