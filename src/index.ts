import {
  CodeActionProvider,
  languages,
  commands,
  ExtensionContext,
  Uri,
  workspace,
  window,
  TextDocument,
  Range,
  Command,
} from 'coc.nvim';
import * as fs from 'fs';
import {isAbsolute, join} from 'path';
import {dirname} from 'path/posix';
import VSPicgo from './picgo';
import {detectImgUrlRange} from './utils';

function uploadImageFromClipboard(
  vspicgo: VSPicgo,
): Promise<string | void | Error> {
  return vspicgo.upload();
}

async function uploadImageFromCursor(vspicgo: VSPicgo) {
  const urlRange = await detectImgUrlRange()
  if (!urlRange) {
    return window.showErrorMessage('Can not detect image url!!');
  }

  const doc = await workspace.document
  let url = doc.textDocument.getText(urlRange)
  if (!url) {
    return window.showErrorMessage('Can not detect image url!!');
  }
  if (!url.startsWith("http")) {
    url = join(dirname(doc.uri), url).replace(/^file:\/*/, "/")
  }

  return vspicgo.upload([url]);
}

async function uploadImageFromInputBox(
  vspicgo: VSPicgo,
): Promise<string | void | Error> {
  const doc = await workspace.document;
  if (!doc) return;
  let result = await window.requestInput(
    'Please input an image location path',
  );
  if (!result) return;

  // check if `result` is a path of image file
  const imageReg = /\.(png|jpg|jpeg|webp|gif|bmp|tiff|ico)$/;
  if (result && imageReg.test(result)) {
    result = isAbsolute(result)
      ? result
      : join(Uri.parse(doc.uri).fsPath, '../', result);
    if (fs.existsSync(result)) {
      return vspicgo.upload([result]);
    } else {
      window.showErrorMessage('No such image.');
    }
  } else {
    window.showErrorMessage('No such image.');
  }
}

class ReactRefactorCodeActionProvider implements CodeActionProvider {
  async provideCodeActions(
    document: TextDocument,
    range: Range,
  ): Promise<Command[]> {
    const codeActions: Command[] = [];
    const selectedText = document.getText(range);
    if (selectedText) {
      codeActions.push({
        command: 'picgo.uploadImageFromClipboard',
        title: 'picgo.uploadImageFromClipboard',
        arguments: ['v'],
      });
      codeActions.push({
        command: 'picgo.uploadImageFromInputBox',
        title: 'picgo.uploadImageFromInputBox',
        arguments: ['v'],
      });
    }
    return codeActions;
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  const disposable = [
    languages.registerCodeActionProvider(
      [{scheme: 'file', pattern: '**/*.{md,markdown}'}],
      new ReactRefactorCodeActionProvider(),
      'coc-picgo',
    ),
    commands.registerCommand('picgo.uploadImageFromClipboard', async mode => {
      const vspicgo = new VSPicgo();
      vspicgo.addGenerateOutputListener()
      vspicgo.mode = mode;
      uploadImageFromClipboard(vspicgo);
    }),
    commands.registerCommand('picgo.uploadImageFromInputBox', mode => {
      const vspicgo = new VSPicgo();
      vspicgo.addGenerateOutputListener()
      vspicgo.mode = mode;
      uploadImageFromInputBox(vspicgo);
    }),
    commands.registerCommand('picgo.uploadImageFromCursor', mode => {
      const vspicgo = new VSPicgo();
      vspicgo.addChangeUrlListener()
      vspicgo.mode = mode;
      uploadImageFromCursor(vspicgo);
    }),
  ];
  context.subscriptions.push(...disposable);
}
