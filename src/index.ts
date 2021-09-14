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
import * as path from 'path';
import VSPicgo from './picgo';

function uploadImageFromClipboard(
  vspicgo: VSPicgo,
): Promise<string | void | Error> {
  return vspicgo.upload();
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
    result = path.isAbsolute(result)
      ? result
      : path.join(Uri.parse(doc.uri).fsPath, '../', result);
    if (fs.existsSync(result)) {
      return vspicgo.upload([result]);
    } else {
      window.showMessage('No such image.');
    }
  } else {
    window.showMessage('No such image.');
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
  const vspicgo = new VSPicgo();
  const disposable = [
    languages.registerCodeActionProvider(
      [{ scheme: 'file', pattern: '**/*.{md,markdown}' }],
      new ReactRefactorCodeActionProvider(),
      'coc-picgo',
    ),
    commands.registerCommand('picgo.uploadImageFromClipboard', async mode => {
      vspicgo.mode = mode;
      uploadImageFromClipboard(vspicgo);
    }),
    commands.registerCommand('picgo.uploadImageFromInputBox', mode => {
      vspicgo.mode = mode;
      uploadImageFromInputBox(vspicgo);
    }),
  ];
  context.subscriptions.push(...disposable);
}
